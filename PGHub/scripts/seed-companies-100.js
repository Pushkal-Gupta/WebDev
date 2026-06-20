#!/usr/bin/env node
// Grow PGcode_companies from the original 29 to exactly 100 curated tech
// companies, and link representative LeetCode-canonical problems to each via
// PGcode_company_problems. Idempotent: existing rows are left untouched; the
// upsert uses ON CONFLICT DO NOTHING for companies and (slug, problem_id, role)
// for the join. Re-runs add nothing new.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes('--dry');
if (!URL || !KEY) { console.error('Missing env'); process.exit(1); }
const sb = createClient(URL, KEY);

// New companies to add. Each row uses the existing PGcode_companies schema:
// slug (kebab-case) · name · tagline (reader-direct, no marketing) · domain ·
// region · hq. position is auto-assigned after MAX(position) so we never
// collide with the original 29. is_featured stays false for new rows.
const NEW_COMPANIES = [
  // Big Tech / consumer
  { slug: 'lyft',              name: 'Lyft',              tagline: 'Rideshare, mobility, mapping, real-time matching.',                domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'airbnb',            name: 'Airbnb',            tagline: 'Travel marketplace, trust + safety, search ranking.',              domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'tesla',             name: 'Tesla',             tagline: 'EVs, autonomy, energy, manufacturing software.',                   domain: 'Hardware',   region: 'global', hq: 'Austin, TX' },
  { slug: 'twitter',           name: 'Twitter / X',       tagline: 'Real-time feed, timeline ranking, social graph.',                  domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'snap',              name: 'Snap',              tagline: 'Camera, AR, messaging, creator tooling.',                          domain: 'Tech',       region: 'global', hq: 'Santa Monica, CA' },
  { slug: 'pinterest',         name: 'Pinterest',         tagline: 'Visual discovery, recommendations, ranking.',                      domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'spotify',           name: 'Spotify',           tagline: 'Streaming audio, recommendations, podcast platform.',              domain: 'Tech',       region: 'global', hq: 'Stockholm, Sweden' },
  { slug: 'dropbox',           name: 'Dropbox',           tagline: 'File sync, collaboration, storage systems.',                       domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },

  // SaaS / collaboration
  { slug: 'salesforce',        name: 'Salesforce',        tagline: 'CRM, enterprise SaaS, workflow automation.',                       domain: 'Enterprise', region: 'global', hq: 'San Francisco, CA' },
  { slug: 'workday',           name: 'Workday',           tagline: 'Enterprise HR, finance, workforce planning.',                      domain: 'Enterprise', region: 'global', hq: 'Pleasanton, CA' },
  { slug: 'asana',             name: 'Asana',             tagline: 'Work management, planning, team coordination.',                    domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'notion',            name: 'Notion',            tagline: 'Docs, wikis, databases for teams.',                                domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'linear',            name: 'Linear',            tagline: 'Issue tracking and project planning for software teams.',          domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'figma',             name: 'Figma',             tagline: 'Collaborative design, multiplayer editing, vector graphics.',      domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'canva',             name: 'Canva',             tagline: 'Drag-and-drop design, templates, creator tools.',                  domain: 'Tech',       region: 'global', hq: 'Sydney, Australia' },
  { slug: 'github',            name: 'GitHub',            tagline: 'Git hosting, code review, CI/CD, developer platform.',             domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'gitlab',            name: 'GitLab',            tagline: 'DevOps platform, source control, pipelines.',                      domain: 'Tech',       region: 'global', hq: 'Remote' },

  // Payments / fintech
  { slug: 'stripe',            name: 'Stripe',            tagline: 'Payments infrastructure, APIs, financial primitives.',             domain: 'Fintech',    region: 'global', hq: 'San Francisco, CA' },
  { slug: 'square',            name: 'Block (Square)',    tagline: 'Payments, point-of-sale, seller and consumer fintech.',            domain: 'Fintech',    region: 'global', hq: 'San Francisco, CA' },
  { slug: 'coinbase',          name: 'Coinbase',          tagline: 'Crypto exchange, custody, on-chain infrastructure.',               domain: 'Fintech',    region: 'global', hq: 'Remote' },
  { slug: 'robinhood',         name: 'Robinhood',         tagline: 'Retail brokerage, market data, mobile trading.',                   domain: 'Fintech',    region: 'global', hq: 'Menlo Park, CA' },

  // Finance / quant
  { slug: 'morgan-stanley',    name: 'Morgan Stanley',    tagline: 'Investment banking, trading, wealth management tech.',             domain: 'Finance',    region: 'global', hq: 'New York, NY' },
  { slug: 'jp-morgan',         name: 'JP Morgan',         tagline: 'Banking, trading systems, payments infrastructure.',               domain: 'Finance',    region: 'global', hq: 'New York, NY' },
  { slug: 'citadel',           name: 'Citadel',           tagline: 'Hedge fund and market-making, low-latency systems.',               domain: 'Finance',    region: 'global', hq: 'Miami, FL' },
  { slug: 'two-sigma',         name: 'Two Sigma',         tagline: 'Quantitative trading, ML for markets.',                            domain: 'Finance',    region: 'global', hq: 'New York, NY' },
  { slug: 'jane-street',       name: 'Jane Street',       tagline: 'Proprietary trading, OCaml, options market-making.',               domain: 'Finance',    region: 'global', hq: 'New York, NY' },
  { slug: 'hudson-river',      name: 'Hudson River Trading', tagline: 'Algorithmic trading, low-latency engineering.',                 domain: 'Finance',    region: 'global', hq: 'New York, NY' },
  { slug: 'jump-trading',      name: 'Jump Trading',      tagline: 'High-frequency trading, FPGA, networking.',                        domain: 'Finance',    region: 'global', hq: 'Chicago, IL' },
  { slug: 'bridgewater',       name: 'Bridgewater',       tagline: 'Macro hedge fund, systematic investing.',                          domain: 'Finance',    region: 'global', hq: 'Westport, CT' },

  // Cloud / infra
  { slug: 'ibm',               name: 'IBM',               tagline: 'Enterprise software, hybrid cloud, mainframes, research.',         domain: 'Enterprise', region: 'global', hq: 'Armonk, NY' },
  { slug: 'cisco',             name: 'Cisco',             tagline: 'Networking, security, collaboration hardware and software.',       domain: 'Hardware',   region: 'global', hq: 'San Jose, CA' },
  { slug: 'vmware',            name: 'VMware',            tagline: 'Virtualization, cloud infrastructure, Kubernetes.',                domain: 'Enterprise', region: 'global', hq: 'Palo Alto, CA' },
  { slug: 'snowflake',         name: 'Snowflake',         tagline: 'Cloud data warehouse, query engine, storage separation.',          domain: 'Enterprise', region: 'global', hq: 'Bozeman, MT' },
  { slug: 'databricks',        name: 'Databricks',        tagline: 'Lakehouse, Spark, ML platform, data engineering.',                 domain: 'Enterprise', region: 'global', hq: 'San Francisco, CA' },
  { slug: 'datadog',           name: 'Datadog',           tagline: 'Observability, metrics, logs, traces at scale.',                   domain: 'Enterprise', region: 'global', hq: 'New York, NY' },
  { slug: 'splunk',            name: 'Splunk',            tagline: 'Log analytics, observability, security operations.',               domain: 'Enterprise', region: 'global', hq: 'San Francisco, CA' },
  { slug: 'mongodb',           name: 'MongoDB',           tagline: 'Document database, Atlas cloud, query engine.',                    domain: 'Enterprise', region: 'global', hq: 'New York, NY' },
  { slug: 'elastic',           name: 'Elastic',           tagline: 'Search, observability, security on Elasticsearch.',                domain: 'Enterprise', region: 'global', hq: 'Remote' },
  { slug: 'hashicorp',         name: 'HashiCorp',         tagline: 'Infrastructure tooling: Terraform, Vault, Consul.',                domain: 'Enterprise', region: 'global', hq: 'San Francisco, CA' },
  { slug: 'cloudflare',        name: 'Cloudflare',        tagline: 'Edge network, CDN, DDoS protection, workers.',                     domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },

  // AI / new tech
  { slug: 'openai',            name: 'OpenAI',            tagline: 'Large language models, API platform, alignment research.',         domain: 'AI',         region: 'global', hq: 'San Francisco, CA' },
  { slug: 'anthropic',         name: 'Anthropic',         tagline: 'Claude models, safety research, agentic systems.',                 domain: 'AI',         region: 'global', hq: 'San Francisco, CA' },
  { slug: 'hugging-face',      name: 'Hugging Face',      tagline: 'Open-source ML hub, transformers, datasets.',                      domain: 'AI',         region: 'global', hq: 'New York, NY' },
  { slug: 'mistral',           name: 'Mistral AI',        tagline: 'Open-weight large language models, European AI lab.',              domain: 'AI',         region: 'global', hq: 'Paris, France' },
  { slug: 'perplexity',        name: 'Perplexity',        tagline: 'Conversational search, retrieval, answer engines.',                domain: 'AI',         region: 'global', hq: 'San Francisco, CA' },
  { slug: 'scale-ai',          name: 'Scale AI',          tagline: 'Data labeling, evaluation, generative AI infrastructure.',         domain: 'AI',         region: 'global', hq: 'San Francisco, CA' },

  // Semis / hardware
  { slug: 'nvidia',            name: 'NVIDIA',            tagline: 'GPUs, CUDA, accelerated computing, AI hardware.',                  domain: 'Hardware',   region: 'global', hq: 'Santa Clara, CA' },
  { slug: 'amd',               name: 'AMD',               tagline: 'CPUs, GPUs, data-center silicon.',                                 domain: 'Hardware',   region: 'global', hq: 'Santa Clara, CA' },
  { slug: 'intel',             name: 'Intel',             tagline: 'CPUs, foundry, server silicon, drivers.',                          domain: 'Hardware',   region: 'global', hq: 'Santa Clara, CA' },
  { slug: 'qualcomm',          name: 'Qualcomm',          tagline: 'Mobile silicon, modems, wireless, edge AI.',                       domain: 'Hardware',   region: 'global', hq: 'San Diego, CA' },
  { slug: 'sony',              name: 'Sony',              tagline: 'Consumer electronics, PlayStation, imaging sensors.',              domain: 'Hardware',   region: 'global', hq: 'Tokyo, Japan' },

  // Retail / commerce
  { slug: 'target',            name: 'Target',            tagline: 'Retail, e-commerce, logistics, supply chain.',                     domain: 'Retail',     region: 'global', hq: 'Minneapolis, MN' },
  { slug: 'ebay',              name: 'eBay',              tagline: 'Marketplace, payments, ranking, fraud detection.',                 domain: 'Tech',       region: 'global', hq: 'San Jose, CA' },
  { slug: 'shopify',           name: 'Shopify',           tagline: 'Commerce platform, storefronts, payments, fulfillment.',           domain: 'Tech',       region: 'global', hq: 'Ottawa, Canada' },
  { slug: 'wayfair',           name: 'Wayfair',           tagline: 'Furniture e-commerce, logistics, search.',                         domain: 'Retail',     region: 'global', hq: 'Boston, MA' },
  { slug: 'instacart',         name: 'Instacart',         tagline: 'Grocery delivery, marketplace, fulfillment.',                      domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'doordash',          name: 'DoorDash',          tagline: 'Local delivery, logistics, dispatch optimization.',                domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },

  // Gaming / media
  { slug: 'ea-games',          name: 'EA Games',          tagline: 'Game studios, engines, online services.',                          domain: 'Gaming',     region: 'global', hq: 'Redwood City, CA' },
  { slug: 'activision',        name: 'Activision Blizzard', tagline: 'Game development, live services, multiplayer infra.',            domain: 'Gaming',     region: 'global', hq: 'Santa Monica, CA' },
  { slug: 'epic-games',        name: 'Epic Games',        tagline: 'Unreal Engine, Fortnite, online services.',                        domain: 'Gaming',     region: 'global', hq: 'Cary, NC' },
  { slug: 'unity',             name: 'Unity',             tagline: 'Game engine, real-time 3D platform.',                              domain: 'Gaming',     region: 'global', hq: 'San Francisco, CA' },
  { slug: 'roblox',            name: 'Roblox',            tagline: 'User-generated games, creator platform, multiplayer infra.',       domain: 'Gaming',     region: 'global', hq: 'San Mateo, CA' },
  { slug: 'disney',            name: 'Disney',            tagline: 'Streaming, theme parks, studios, sports media tech.',              domain: 'Media',      region: 'global', hq: 'Burbank, CA' },

  // Travel / consumer
  { slug: 'yelp',              name: 'Yelp',              tagline: 'Local search, reviews, ads.',                                      domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'booking',           name: 'Booking.com',       tagline: 'Travel booking, ranking, inventory.',                              domain: 'Tech',       region: 'global', hq: 'Amsterdam, Netherlands' },
  { slug: 'expedia',           name: 'Expedia',           tagline: 'Travel marketplace, pricing, fulfillment.',                        domain: 'Tech',       region: 'global', hq: 'Seattle, WA' },

  // Indian / global tech
  { slug: 'paytm',             name: 'Paytm',             tagline: 'Payments, banking, commerce in India.',                            domain: 'Fintech',    region: 'india',  hq: 'Noida, India' },
  { slug: 'phonepe',           name: 'PhonePe',           tagline: 'UPI payments, financial services in India.',                       domain: 'Fintech',    region: 'india',  hq: 'Bengaluru, India' },
  { slug: 'freshworks',        name: 'Freshworks',        tagline: 'Customer support, IT service management SaaS.',                    domain: 'Enterprise', region: 'india',  hq: 'Chennai, India' },
  { slug: 'ola',               name: 'Ola',               tagline: 'Mobility, electric vehicles, ride dispatch.',                      domain: 'Tech',       region: 'india',  hq: 'Bengaluru, India' },
  { slug: 'makemytrip',        name: 'MakeMyTrip',        tagline: 'Travel booking, fares, hotels in India.',                          domain: 'Tech',       region: 'india',  hq: 'Gurugram, India' },
];

// Universal high-frequency LeetCode problems most companies actually ask. Used
// as the baseline link set for every new company. Lists are matched against
// PGcode_problems.name with normalized comparison; misses are reported.
const UNIVERSAL_15 = [
  'Two Sum',
  'Valid Parentheses',
  'Merge Two Sorted Lists',
  'Best Time to Buy and Sell Stock',
  'Valid Palindrome',
  'Reverse Linked List',
  'Maximum Subarray',
  'Climbing Stairs',
  'Number of Islands',
  'LRU Cache',
  'Merge Intervals',
  'Top K Frequent Elements',
  'Word Break',
  'Course Schedule',
  'Longest Substring Without Repeating Characters',
];

// Specialty overlays — appended to the universal 15 for the relevant domains.
// Keep these tight; reviewers should be able to vouch for each as a known
// favorite in that domain's onsites.
const SPECIALTY = {
  finance: [
    '3Sum',
    'Sliding Window Maximum',
    'Trapping Rain Water',
    'Find Median from Data Stream',
    'Best Time to Buy and Sell Stock IV',
    'Maximum Product Subarray',
    'Subarray Sum Equals K',
  ],
  ai: [
    'Word Ladder',
    'Word Search II',
    'Edit Distance',
    'Longest Increasing Subsequence',
    'Course Schedule II',
    'Alien Dictionary',
    'Find Median from Data Stream',
  ],
  infra: [
    'Design HashMap',
    'Insert Delete GetRandom O(1)',
    'LFU Cache',
    'Design Add and Search Words Data Structure',
    'Encode and Decode Strings',
    'Serialize and Deserialize Binary Tree',
    'Find Median from Data Stream',
  ],
  gaming: [
    'Game of Life',
    'Word Search',
    'Number of Islands',
    'Maximal Square',
    'Sudoku Solver',
    'Spiral Matrix',
  ],
  hardware: [
    'Reverse Bits',
    'Number of 1 Bits',
    'Single Number',
    'Power of Two',
    'Bitwise AND of Numbers Range',
    'Maximum XOR of Two Numbers in an Array',
  ],
  retail: [
    'Group Anagrams',
    'Product of Array Except Self',
    'Subarray Sum Equals K',
    'Top K Frequent Words',
    'K Closest Points to Origin',
  ],
  travel: [
    'Reconstruct Itinerary',
    'Cheapest Flights Within K Stops',
    'Network Delay Time',
    'Minimum Spanning Tree (Connecting Cities With Minimum Cost)',
  ],
};

// Bucket each new company into one specialty (or null for none). Universal 15
// always applies; specialty rides on top to push link counts to ~15-20.
const SPECIALTY_BY_SLUG = {
  // finance / fintech
  'morgan-stanley': 'finance', 'jp-morgan': 'finance', 'citadel': 'finance', 'two-sigma': 'finance',
  'jane-street': 'finance', 'hudson-river': 'finance', 'jump-trading': 'finance', 'bridgewater': 'finance',
  'stripe': 'finance', 'square': 'finance', 'coinbase': 'finance', 'robinhood': 'finance',
  'paytm': 'finance', 'phonepe': 'finance',
  // ai
  'openai': 'ai', 'anthropic': 'ai', 'hugging-face': 'ai', 'mistral': 'ai',
  'perplexity': 'ai', 'scale-ai': 'ai',
  // infra / cloud
  'ibm': 'infra', 'cisco': 'infra', 'vmware': 'infra', 'snowflake': 'infra', 'databricks': 'infra',
  'datadog': 'infra', 'splunk': 'infra', 'mongodb': 'infra', 'elastic': 'infra',
  'hashicorp': 'infra', 'cloudflare': 'infra',
  // gaming / media
  'ea-games': 'gaming', 'activision': 'gaming', 'epic-games': 'gaming',
  'unity': 'gaming', 'roblox': 'gaming', 'disney': 'gaming',
  // hardware / semis
  'nvidia': 'hardware', 'amd': 'hardware', 'intel': 'hardware', 'qualcomm': 'hardware',
  'sony': 'hardware', 'tesla': 'hardware',
  // retail / commerce
  'target': 'retail', 'ebay': 'retail', 'shopify': 'retail', 'wayfair': 'retail',
  'instacart': 'retail', 'doordash': 'retail',
  // travel
  'yelp': 'travel', 'booking': 'travel', 'expedia': 'travel', 'makemytrip': 'travel',
  // social / consumer (no specialty overlay; universal 15 only)
  'lyft': null, 'airbnb': null, 'twitter': null, 'snap': null, 'pinterest': null,
  'spotify': null, 'dropbox': null, 'ola': null,
  // saas
  'salesforce': null, 'workday': null, 'asana': null, 'notion': null, 'linear': null,
  'figma': null, 'canva': null, 'github': 'infra', 'gitlab': 'infra',
  'freshworks': null,
};

function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }

// Verify the new list reaches exactly 100 with no duplicate slugs.
const newSlugs = new Set(NEW_COMPANIES.map(c => c.slug));
if (newSlugs.size !== NEW_COMPANIES.length) {
  console.error('Duplicate slug in NEW_COMPANIES list');
  process.exit(1);
}

// Read existing companies so we never collide and so position picks up after.
const { data: existing, error: exErr } = await sb
  .from('PGcode_companies')
  .select('slug, position');
if (exErr) { console.error(exErr); process.exit(1); }
const existingSlugs = new Set(existing.map(c => c.slug));
const maxPos = existing.reduce((m, c) => Math.max(m, c.position || 0), 0);

const toInsert = NEW_COMPANIES.filter(c => !existingSlugs.has(c.slug));
console.log(`Existing companies: ${existing.length}`);
console.log(`New companies to insert: ${toInsert.length}`);
console.log(`Target total: ${existing.length + toInsert.length}`);

if (existing.length + toInsert.length !== 100) {
  console.warn(`WARN: target is not 100 (got ${existing.length + toInsert.length}).`);
}

if (!DRY) {
  const rows = toInsert.map((c, i) => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    domain: c.domain,
    region: c.region,
    hq: c.hq,
    position: maxPos + 1 + i,
    is_featured: false,
  }));
  if (rows.length) {
    // PostgREST upsert with ignoreDuplicates honors ON CONFLICT DO NOTHING.
    const { error } = await sb
      .from('PGcode_companies')
      .upsert(rows, { onConflict: 'slug', ignoreDuplicates: true });
    if (error) {
      console.error('Company insert error:', error.message);
      process.exit(1);
    }
    console.log(`Inserted ${rows.length} new company rows.`);
  } else {
    console.log('No new companies to insert (all present).');
  }
}

// Resolve problem names to PGcode_problems ids for the join table. PostgREST
// caps a single SELECT at ~1000 rows, so paginate explicitly with .range().
async function loadAllProblems() {
  const out = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, name')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || !data.length) break;
    out.push(...data);
    if (data.length < PAGE) break;
  }
  return out;
}
const problems = await loadAllProblems();
const byNorm = new Map();
for (const p of problems) byNorm.set(norm(p.name), p);
console.log(`Loaded ${problems.length} problems for matching.`);

function resolveNames(names) {
  const found = [];
  const missing = [];
  for (const n of names) {
    const p = byNorm.get(norm(n));
    if (p) found.push(p); else missing.push(n);
  }
  return { found, missing };
}

console.log('\n--- company-problem links ---');
let totalLinks = 0;
let totalMissing = 0;
for (const c of NEW_COMPANIES) {
  const overlay = SPECIALTY_BY_SLUG[c.slug];
  const names = overlay
    ? [...UNIVERSAL_15, ...(SPECIALTY[overlay] || [])]
    : [...UNIVERSAL_15];
  const { found, missing } = resolveNames(names);
  totalMissing += missing.length;
  if (DRY) {
    console.log(`${c.slug.padEnd(20)} would link ${found.length}/${names.length}`);
    continue;
  }
  const rows = found.map(p => ({
    company_slug: c.slug,
    problem_id: p.id,
    frequency_score: 75,
    role: 'sde',
  }));
  if (!rows.length) continue;
  const { error } = await sb
    .from('PGcode_company_problems')
    .upsert(rows, { onConflict: 'company_slug,problem_id,role', ignoreDuplicates: true });
  if (error) console.log(`  ${c.slug} link error: ${error.message}`);
  else {
    console.log(`${c.slug.padEnd(20)} linked ${rows.length} problems`);
    totalLinks += rows.length;
  }
}

console.log(`\nDone. ${toInsert.length} companies queued, ~${totalLinks} link rows upserted, ${totalMissing} name-misses skipped.`);
