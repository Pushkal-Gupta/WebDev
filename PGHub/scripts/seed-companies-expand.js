#!/usr/bin/env node
// Expand PGcode_companies beyond the curated 100 with more well-known employers
// across fintech, dev-tools, gaming, chips, enterprise, AI, and international
// (esp. India). Idempotent + dedup-safe: fetches existing slugs first and only
// inserts genuinely new rows; positions continue after MAX(position). Re-runs
// add nothing. Taglines are reader-direct (what they build), not marketing.
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
if (!URL || !KEY) { console.error('Missing SUPABASE env'); process.exit(1); }
const sb = createClient(URL, KEY);

const CANDIDATES = [
  // Fintech / payments
  { slug: 'stripe',       name: 'Stripe',        tagline: 'Payments infrastructure, APIs, fraud, ledgers.',            domain: 'Fintech',    region: 'global', hq: 'San Francisco, CA' },
  { slug: 'plaid',        name: 'Plaid',         tagline: 'Bank connectivity APIs, financial data networks.',          domain: 'Fintech',    region: 'global', hq: 'San Francisco, CA' },
  { slug: 'robinhood',    name: 'Robinhood',     tagline: 'Brokerage, real-time trading, market data.',                domain: 'Fintech',    region: 'global', hq: 'Menlo Park, CA' },
  { slug: 'coinbase',     name: 'Coinbase',      tagline: 'Crypto exchange, wallets, custody, matching engines.',      domain: 'Fintech',    region: 'global', hq: 'Remote, US' },
  { slug: 'wise',         name: 'Wise',          tagline: 'Cross-border payments, FX, multi-currency accounts.',       domain: 'Fintech',    region: 'global', hq: 'London, UK' },
  { slug: 'revolut',      name: 'Revolut',       tagline: 'Neobank, cards, FX, financial super-app.',                  domain: 'Fintech',    region: 'global', hq: 'London, UK' },
  { slug: 'klarna',       name: 'Klarna',        tagline: 'Payments, buy-now-pay-later, checkout.',                    domain: 'Fintech',    region: 'global', hq: 'Stockholm, Sweden' },
  { slug: 'brex',         name: 'Brex',          tagline: 'Corporate cards, spend management, banking.',               domain: 'Fintech',    region: 'global', hq: 'San Francisco, CA' },
  { slug: 'ramp',         name: 'Ramp',          tagline: 'Corporate cards, expense automation, finance ops.',         domain: 'Fintech',    region: 'global', hq: 'New York, NY' },
  // Dev tools / infra
  { slug: 'databricks',   name: 'Databricks',    tagline: 'Lakehouse, Spark, ML platform, large-scale data.',          domain: 'Enterprise', region: 'global', hq: 'San Francisco, CA' },
  { slug: 'snowflake',    name: 'Snowflake',     tagline: 'Cloud data warehouse, query engines, storage.',             domain: 'Enterprise', region: 'global', hq: 'Bozeman, MT' },
  { slug: 'mongodb',      name: 'MongoDB',       tagline: 'Document databases, distributed storage, drivers.',          domain: 'Enterprise', region: 'global', hq: 'New York, NY' },
  { slug: 'datadog',      name: 'Datadog',       tagline: 'Observability, metrics, tracing, time-series at scale.',     domain: 'Enterprise', region: 'global', hq: 'New York, NY' },
  { slug: 'hashicorp',    name: 'HashiCorp',     tagline: 'Infra automation, Terraform, Vault, distributed systems.',  domain: 'Enterprise', region: 'global', hq: 'San Francisco, CA' },
  { slug: 'confluent',    name: 'Confluent',     tagline: 'Kafka, streaming data, event pipelines.',                   domain: 'Enterprise', region: 'global', hq: 'Mountain View, CA' },
  { slug: 'elastic',      name: 'Elastic',       tagline: 'Search, Elasticsearch, log analytics.',                     domain: 'Enterprise', region: 'global', hq: 'Mountain View, CA' },
  { slug: 'gitlab',       name: 'GitLab',        tagline: 'DevOps platform, CI/CD, source control.',                   domain: 'Tech',       region: 'global', hq: 'Remote' },
  { slug: 'twilio',       name: 'Twilio',        tagline: 'Communications APIs, messaging, voice at scale.',           domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'cloudflare',   name: 'Cloudflare',    tagline: 'CDN, edge compute, DDoS, networking.',                      domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'vercel',       name: 'Vercel',        tagline: 'Frontend cloud, edge functions, Next.js.',                  domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'jetbrains',    name: 'JetBrains',     tagline: 'Developer tools, IDEs, language tooling.',                  domain: 'Tech',       region: 'global', hq: 'Prague, Czechia' },
  // Security
  { slug: 'crowdstrike',  name: 'CrowdStrike',   tagline: 'Endpoint security, threat detection at scale.',             domain: 'Enterprise', region: 'global', hq: 'Austin, TX' },
  { slug: 'palo-alto',    name: 'Palo Alto Networks', tagline: 'Network + cloud security, firewalls, detection.',      domain: 'Enterprise', region: 'global', hq: 'Santa Clara, CA' },
  { slug: 'okta',         name: 'Okta',          tagline: 'Identity, SSO, auth, access management.',                   domain: 'Enterprise', region: 'global', hq: 'San Francisco, CA' },
  { slug: 'zscaler',      name: 'Zscaler',       tagline: 'Cloud security, zero trust, secure access.',                domain: 'Enterprise', region: 'global', hq: 'San Jose, CA' },
  // Chips / hardware
  { slug: 'amd',          name: 'AMD',           tagline: 'CPUs, GPUs, chip design, low-level performance.',           domain: 'Hardware',   region: 'global', hq: 'Santa Clara, CA' },
  { slug: 'qualcomm',     name: 'Qualcomm',      tagline: 'Mobile chips, modems, embedded, signal processing.',        domain: 'Hardware',   region: 'global', hq: 'San Diego, CA' },
  { slug: 'arm',          name: 'Arm',           tagline: 'CPU architecture, embedded, licensing.',                    domain: 'Hardware',   region: 'global', hq: 'Cambridge, UK' },
  { slug: 'tsmc',         name: 'TSMC',          tagline: 'Semiconductor fabrication, process, manufacturing.',        domain: 'Hardware',   region: 'global', hq: 'Hsinchu, Taiwan' },
  { slug: 'micron',       name: 'Micron',        tagline: 'Memory, storage, DRAM, firmware.',                          domain: 'Hardware',   region: 'global', hq: 'Boise, ID' },
  // Gaming
  { slug: 'roblox',       name: 'Roblox',        tagline: 'UGC gaming, real-time worlds, economy systems.',            domain: 'Tech',       region: 'global', hq: 'San Mateo, CA' },
  { slug: 'unity',        name: 'Unity',         tagline: 'Game engine, real-time 3D, graphics.',                      domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'epic-games',   name: 'Epic Games',    tagline: 'Unreal Engine, Fortnite, real-time systems.',               domain: 'Tech',       region: 'global', hq: 'Cary, NC' },
  { slug: 'riot-games',   name: 'Riot Games',    tagline: 'Live games, matchmaking, anti-cheat, netcode.',             domain: 'Tech',       region: 'global', hq: 'Los Angeles, CA' },
  { slug: 'nintendo',     name: 'Nintendo',      tagline: 'Consoles, games, embedded, hardware.',                      domain: 'Hardware',   region: 'global', hq: 'Kyoto, Japan' },
  // Consumer / product
  { slug: 'doordash',     name: 'DoorDash',      tagline: 'Delivery logistics, dispatch, marketplace.',                domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'instacart',    name: 'Instacart',     tagline: 'Grocery delivery, catalog, fulfillment.',                   domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'shopify',      name: 'Shopify',       tagline: 'Commerce platform, storefronts, checkout, scale.',          domain: 'Tech',       region: 'global', hq: 'Ottawa, Canada' },
  { slug: 'reddit',       name: 'Reddit',        tagline: 'Communities, ranking, feed, moderation.',                   domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'discord',      name: 'Discord',       tagline: 'Real-time chat, voice, communities.',                       domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'figma',        name: 'Figma',         tagline: 'Collaborative design, multiplayer, rendering.',             domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'notion',       name: 'Notion',        tagline: 'Docs, databases, collaborative workspace.',                 domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'canva',        name: 'Canva',         tagline: 'Design tools, templates, rendering at scale.',              domain: 'Tech',       region: 'global', hq: 'Sydney, Australia' },
  { slug: 'duolingo',     name: 'Duolingo',      tagline: 'Language learning, gamification, ML models.',               domain: 'Tech',       region: 'global', hq: 'Pittsburgh, PA' },
  { slug: 'grammarly',    name: 'Grammarly',     tagline: 'Writing assistance, NLP, real-time suggestions.',           domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  // AI
  { slug: 'openai',       name: 'OpenAI',        tagline: 'Foundation models, inference, research systems.',           domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'anthropic',    name: 'Anthropic',     tagline: 'AI safety, large models, inference at scale.',              domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  { slug: 'huggingface',  name: 'Hugging Face',  tagline: 'ML hub, transformers, open models, tooling.',               domain: 'Tech',       region: 'global', hq: 'New York, NY' },
  { slug: 'scale-ai',     name: 'Scale AI',      tagline: 'Data labeling, ML infra, evaluation.',                      domain: 'Tech',       region: 'global', hq: 'San Francisco, CA' },
  // International — India
  { slug: 'zerodha',      name: 'Zerodha',       tagline: 'Brokerage, trading platform, market systems.',              domain: 'Fintech',    region: 'india',  hq: 'Bengaluru, India' },
  { slug: 'razorpay',     name: 'Razorpay',      tagline: 'Payments, banking APIs, settlements.',                      domain: 'Fintech',    region: 'india',  hq: 'Bengaluru, India' },
  { slug: 'cred',         name: 'CRED',          tagline: 'Credit payments, rewards, fintech product.',                domain: 'Fintech',    region: 'india',  hq: 'Bengaluru, India' },
  { slug: 'phonepe',      name: 'PhonePe',       tagline: 'UPI payments, wallets, high-scale transactions.',           domain: 'Fintech',    region: 'india',  hq: 'Bengaluru, India' },
  { slug: 'paytm',        name: 'Paytm',         tagline: 'Payments, wallets, commerce, financial services.',          domain: 'Fintech',    region: 'india',  hq: 'Noida, India' },
  { slug: 'flipkart',     name: 'Flipkart',      tagline: 'E-commerce, catalog, logistics, search.',                   domain: 'Tech',       region: 'india',  hq: 'Bengaluru, India' },
  { slug: 'swiggy',       name: 'Swiggy',        tagline: 'Food + quick delivery, dispatch, logistics.',               domain: 'Tech',       region: 'india',  hq: 'Bengaluru, India' },
  { slug: 'zomato',       name: 'Zomato',        tagline: 'Food delivery, discovery, logistics.',                      domain: 'Tech',       region: 'india',  hq: 'Gurugram, India' },
  { slug: 'freshworks',   name: 'Freshworks',    tagline: 'SaaS, CRM, support software, multi-tenant.',                domain: 'Enterprise', region: 'india',  hq: 'Chennai, India' },
  { slug: 'zoho',         name: 'Zoho',          tagline: 'SaaS suite, business software, self-hosted infra.',         domain: 'Enterprise', region: 'india',  hq: 'Chennai, India' },
  { slug: 'ola',          name: 'Ola',           tagline: 'Rideshare, mobility, EVs, mapping.',                        domain: 'Tech',       region: 'india',  hq: 'Bengaluru, India' },
  { slug: 'meesho',       name: 'Meesho',        tagline: 'Social commerce, marketplace, logistics.',                  domain: 'Tech',       region: 'india',  hq: 'Bengaluru, India' },
  { slug: 'dream11',      name: 'Dream11',       tagline: 'Fantasy sports, real-time scale, gaming.',                  domain: 'Tech',       region: 'india',  hq: 'Mumbai, India' },
  { slug: 'postman',      name: 'Postman',       tagline: 'API platform, tooling, collaboration.',                     domain: 'Tech',       region: 'india',  hq: 'San Francisco, CA' },
  // International — other
  { slug: 'grab',         name: 'Grab',          tagline: 'Super-app, mobility, delivery, payments.',                  domain: 'Tech',       region: 'global', hq: 'Singapore' },
  { slug: 'sea',          name: 'Sea (Shopee)',  tagline: 'E-commerce, gaming, fintech at scale.',                     domain: 'Tech',       region: 'global', hq: 'Singapore' },
  { slug: 'mercadolibre', name: 'MercadoLibre',  tagline: 'E-commerce + payments across Latin America.',               domain: 'Tech',       region: 'global', hq: 'Buenos Aires, Argentina' },
  { slug: 'nubank',       name: 'Nubank',        tagline: 'Digital bank, cards, financial services at scale.',         domain: 'Fintech',    region: 'global', hq: 'São Paulo, Brazil' },
  { slug: 'atlassian',    name: 'Atlassian',     tagline: 'Jira, Confluence, dev collaboration tooling.',              domain: 'Enterprise', region: 'global', hq: 'Sydney, Australia' },
  { slug: 'servicenow',   name: 'ServiceNow',    tagline: 'Enterprise workflows, ITSM, platform.',                     domain: 'Enterprise', region: 'global', hq: 'Santa Clara, CA' },
  { slug: 'vmware',       name: 'VMware',        tagline: 'Virtualization, cloud infra, systems.',                     domain: 'Enterprise', region: 'global', hq: 'Palo Alto, CA' },
  { slug: 'sap',          name: 'SAP',           tagline: 'Enterprise resource planning, business software.',          domain: 'Enterprise', region: 'global', hq: 'Walldorf, Germany' },
];

(async () => {
  const { data: existing, error } = await sb.from('PGcode_companies').select('slug, position');
  if (error) { console.error('Fetch failed:', error.message); process.exit(1); }
  const have = new Set((existing || []).map((c) => c.slug));
  let pos = Math.max(0, ...(existing || []).map((c) => c.position || 0));
  const toAdd = CANDIDATES.filter((c) => !have.has(c.slug));
  console.log(`Existing companies: ${have.size} · candidates: ${CANDIDATES.length} · new to add: ${toAdd.length}`);
  if (!toAdd.length) { console.log('Nothing new — all candidates already present.'); return; }
  const rows = toAdd.map((c) => ({ ...c, position: ++pos, is_featured: false }));
  if (DRY) { console.log('DRY RUN — would add:', rows.map((r) => r.slug).join(', ')); return; }
  const { error: e2 } = await sb.from('PGcode_companies').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true });
  if (e2) { console.error('Insert failed:', e2.message); process.exit(1); }
  console.log(`Added ${rows.length} companies. Total now ~${have.size + rows.length}.`);
})();
