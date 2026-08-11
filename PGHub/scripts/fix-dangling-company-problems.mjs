// Remap pre-existing dangling company_problem ids (legacy "-stub"/"-500" suffixes that point
// to non-existent problems, so they render as nothing) to their real catalog slugs. If a
// company already has the clean slug, the stub row is deleted (dedup); otherwise it's updated
// in place, preserving frequency_score/role. Idempotent. --dry to preview.
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');

const MAP = {
  'median-of-two-sorted-arrays-500': 'median-of-two-sorted-arrays',
  'number-islands-stub': 'num-islands',
  'course-schedule-stub': 'course-schedule',
  'max-subarray-stub': 'maximum-subarray',
  'k-closest-points-500': 'k-closest-points-to-origin',
  'group-anagrams-stub': 'group-anagrams',
  'top-k-frequent-stub': 'top-k-frequent',
  'merge-two-lists-stub': 'merge-two-sorted',
  'climbing-stairs-stub': 'climbing-stairs',
};

async function main() {
  const targets = [...new Set(Object.values(MAP))];
  const exist = new Set();
  for (let i = 0; i < targets.length; i += 100) {
    const { data } = await sb.from('PGcode_problems').select('id').in('id', targets.slice(i, i + 100));
    for (const p of (data || [])) exist.add(p.id);
  }
  const badTargets = targets.filter((t) => !exist.has(t));
  if (badTargets.length) { console.error('ABORT — these remap targets do not exist:', badTargets.join(', ')); process.exit(1); }
  console.log('all remap targets exist. Proceeding' + (DRY ? ' (dry)' : '') + '...');

  let updated = 0, deleted = 0;
  for (const [stub, clean] of Object.entries(MAP)) {
    const { data: rows } = await sb.from('PGcode_company_problems').select('company_slug').eq('problem_id', stub);
    for (const { company_slug } of (rows || [])) {
      const { data: dupe } = await sb.from('PGcode_company_problems')
        .select('problem_id').eq('company_slug', company_slug).eq('problem_id', clean).maybeSingle();
      if (dupe) {
        if (!DRY) await sb.from('PGcode_company_problems').delete().eq('company_slug', company_slug).eq('problem_id', stub);
        deleted++;
      } else {
        if (!DRY) await sb.from('PGcode_company_problems').update({ problem_id: clean }).eq('company_slug', company_slug).eq('problem_id', stub);
        updated++;
      }
    }
    console.log(`  ${stub} -> ${clean}: ${(rows || []).length} rows`);
  }
  console.log(DRY ? `DRY — would update ${updated}, delete(dedup) ${deleted}.` : `Done. Remapped ${updated}, deduped ${deleted}.`);
}
main();
