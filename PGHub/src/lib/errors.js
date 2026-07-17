// Central error sanitizer. Raw Supabase/Postgres/Judge0 errors leak internal details
// (table names like PGcode_*, column names, RLS policy names, SQL fragments). NEVER show a
// raw backend error to the user — always route it through friendlyError, which maps known
// cases to clean copy and falls back to a generic message for anything that smells like an
// internal detail.
const INTERNAL = /pgcode_|supabase|postgres|postgrest|\brelation\b|\bcolumn\b|\bschema\b|\bsql\b|constraint|policy|\brole\b|auth\.|\.from\(|duplicate key|pkey|_fkey|rls|jwt|service_role|edge function|\btable\b|stack trace|at\s+\w+\s*\(|\bnode_modules\b|0x[0-9a-f]{4,}/i;

export function friendlyError(e, fallback = 'Something went wrong. Please try again.') {
  const raw = (e?.message || e?.error_description || e?.error?.message || (typeof e === 'string' ? e : '') || '').toString().trim();
  if (!raw) return fallback;
  const low = raw.toLowerCase();

  if (low.includes('fetch failed') || low.includes('failed to fetch') || low.includes('networkerror') || low.includes('load failed') || low.includes('err_')) return 'Network error — check your connection and try again.';
  if (low.includes('not authenticated') || low.includes('invalid login') || low.includes('unauthorized') || low.includes('401') || low.includes('jwt')) return 'Please sign in and try again.';
  if (low.includes('row-level security') || low.includes('permission denied') || low.includes('403') || low.includes('not allowed')) return "You don't have permission to do that.";
  if (low.includes('duplicate') || low.includes('already exists') || low.includes('unique')) return 'That already exists.';
  if (low.includes('foreign key')) return "That reference isn't valid anymore.";
  if (low.includes('violates') || low.includes('null value') || low.includes('check constraint') || low.includes('invalid input')) return "That didn't save — please check your input.";
  if (low.includes('rate limit') || low.includes('too many')) return 'Too many requests — please wait a moment.';
  if (low.includes('timeout') || low.includes('timed out') || low.includes('etimedout')) return 'That took too long — please try again.';
  if (low.includes('not found') || low.includes('404')) return "We couldn't find that.";

  // If the message mentions ANY internal detail, hide it behind the generic fallback.
  if (INTERNAL.test(raw)) return fallback;
  // Otherwise a short, clean, human message is safe to surface as-is.
  if (raw.length <= 120 && !/[{}<>[\]]/.test(raw) && !raw.includes('://')) return raw;
  return fallback;
}
