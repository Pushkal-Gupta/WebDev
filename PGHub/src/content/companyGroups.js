// Company group definitions — landing tabs that filter the company catalog.
// Each group resolves to its members either by explicit `slugs` or by a
// `match(company)` predicate over the row fields (domain, region, slug, name).
// Mirrors the ML group pattern (src/content/mlGroups.js): a hub of cards, each
// opening a filtered list page at /company/g/:groupSlug.

const has = (set) => (c) => set.has(c.slug);

// Each group carries an `iconName` (a distinct lucide glyph that reads as the
// group's meaning) and a `hue` (one of the theme --hue-* tokens, or 'accent')
// so its hub card gets a unique tinted emblem instead of a generic square.
export const COMPANY_GROUPS = {
  faang: {
    iconName: 'Landmark',
    hue: 'accent',
    title: 'FAANG',
    acronym: 'FAANG',
    summary: 'The five that set the interview bar — Facebook (Meta), Amazon, Apple, Netflix, Google.',
    order: ['facebook', 'meta', 'amazon', 'apple', 'netflix', 'google'],
    match: has(new Set(['meta', 'facebook', 'amazon', 'apple', 'netflix', 'google'])),
  },
  gayman: {
    iconName: 'Star',
    hue: 'violet',
    title: 'New Guard',
    acronym: 'GAYMAN',
    summary: 'GAYMAN — Google, Amazon, Y Combinator, Meta, Apple, Nvidia, the AI-era heavyweights every loop now measures you against.',
    order: ['google', 'amazon', 'y-combinator', 'meta', 'apple', 'nvidia'],
    match: has(new Set(['google', 'amazon', 'y-combinator', 'meta', 'apple', 'nvidia'])),
  },
  mango: {
    iconName: 'Sparkles',
    hue: 'pink',
    title: 'AI Frontier',
    acronym: 'MANGO',
    summary: 'MANGO — Microsoft, Apple, Nvidia, Google, OpenAI, the companies steering the AI era.',
    order: ['microsoft', 'apple', 'nvidia', 'google', 'openai'],
    match: has(new Set(['microsoft', 'apple', 'nvidia', 'google', 'openai'])),
  },
  'big-tech': {
    iconName: 'Building2',
    hue: 'sky',
    title: 'Big Tech',
    summary: 'Large-scale product companies where distributed systems and scale dominate the loop.',
    match: has(new Set([
      'microsoft', 'google', 'amazon', 'meta', 'facebook', 'apple', 'netflix',
      'nvidia', 'adobe', 'salesforce', 'oracle', 'ibm', 'sap', 'cisco', 'intel',
      'qualcomm', 'vmware', 'dell', 'workday', 'servicenow',
    ])),
  },
  unicorns: {
    iconName: 'Rocket',
    hue: 'mint',
    title: 'Unicorns & Scale-ups',
    summary: 'High-growth product companies — fast loops, heavy on practical design and ownership.',
    match: has(new Set([
      'airbnb', 'uber', 'lyft', 'stripe', 'figma', 'canva', 'notion', 'linear',
      'asana', 'databricks', 'snowflake', 'instacart', 'doordash', 'pinterest',
      'snap', 'spotify', 'dropbox', 'github', 'gitlab', 'reddit', 'discord',
      'plaid', 'brex', 'rippling', 'ramp', 'openai', 'anthropic', 'scale-ai',
    ])),
  },
  fintech: {
    iconName: 'LineChart',
    hue: 'violet',
    title: 'Fintech & Quant',
    summary: 'Payments, trading, and quant shops — correctness, latency, and numeric edge cases bite hardest here.',
    match: (c) => ['Fintech', 'Finance'].includes(c.domain)
      || ['stripe', 'square', 'coinbase', 'robinhood', 'plaid', 'brex', 'ramp',
          'citadel', 'two-sigma', 'jane-street', 'hudson-river', 'jp-morgan',
          'morgan-stanley', 'goldman-sachs'].includes(c.slug),
  },
  enterprise: {
    iconName: 'Cloud',
    hue: 'sky',
    title: 'Enterprise & Cloud',
    summary: 'B2B SaaS and cloud platforms — API design, multi-tenancy, and reliability questions.',
    match: (c) => c.domain === 'Enterprise'
      || ['salesforce', 'workday', 'servicenow', 'sap', 'oracle', 'atlassian',
          'snowflake', 'databricks', 'mongodb', 'datadog', 'twilio'].includes(c.slug),
  },
  india: {
    iconName: 'MapPin',
    hue: 'mint',
    title: 'India',
    summary: 'Product and services companies hiring across India — from startups to the global majors local offices.',
    match: (c) => c.region === 'india',
  },
};

// Public web domain per company slug — used to source the brand logo image from
// Clearbit (https://logo.clearbit.com/{domain}). Only the public domain travels
// in the URL; no user data. Unknown slugs fall back to a name-derived guess.
const COMPANY_WEB_DOMAINS = {
  google: 'google.com', meta: 'meta.com', facebook: 'meta.com', amazon: 'amazon.com',
  microsoft: 'microsoft.com', apple: 'apple.com', netflix: 'netflix.com',
  nvidia: 'nvidia.com', openai: 'openai.com', anthropic: 'anthropic.com',
  adobe: 'adobe.com', uber: 'uber.com', lyft: 'lyft.com', atlassian: 'atlassian.com',
  bloomberg: 'bloomberg.com', 'goldman-sachs': 'goldmansachs.com', walmart: 'walmart.com',
  oracle: 'oracle.com', paypal: 'paypal.com', servicenow: 'servicenow.com',
  intuit: 'intuit.com', samsung: 'samsung.com', 'de-shaw': 'deshaw.com',
  'tower-research': 'tower-research.com', 'y-combinator': 'ycombinator.com',
  salesforce: 'salesforce.com', workday: 'workday.com', asana: 'asana.com',
  notion: 'notion.so', linear: 'linear.app', figma: 'figma.com', canva: 'canva.com',
  github: 'github.com', gitlab: 'gitlab.com', airbnb: 'airbnb.com', tesla: 'tesla.com',
  twitter: 'x.com', snap: 'snap.com', pinterest: 'pinterest.com', spotify: 'spotify.com',
  dropbox: 'dropbox.com', stripe: 'stripe.com', square: 'block.xyz', coinbase: 'coinbase.com',
  robinhood: 'robinhood.com', 'morgan-stanley': 'morganstanley.com', 'jp-morgan': 'jpmorgan.com',
  citadel: 'citadel.com', 'two-sigma': 'twosigma.com', 'jane-street': 'janestreet.com',
  'hudson-river': 'hudsonrivertrading.com', 'jump-trading': 'jumptrading.com',
  bridgewater: 'bridgewater.com', ibm: 'ibm.com', cisco: 'cisco.com', vmware: 'vmware.com',
  snowflake: 'snowflake.com', databricks: 'databricks.com', datadog: 'datadoghq.com',
  splunk: 'splunk.com', mongodb: 'mongodb.com', cloudflare: 'cloudflare.com',
  elastic: 'elastic.co', hashicorp: 'hashicorp.com', twilio: 'twilio.com',
  amd: 'amd.com', intel: 'intel.com', qualcomm: 'qualcomm.com', sony: 'sony.com',
  sap: 'sap.com', dell: 'dell.com', shopify: 'shopify.com', ebay: 'ebay.com',
  booking: 'booking.com', expedia: 'expedia.com', doordash: 'doordash.com',
  instacart: 'instacart.com', wayfair: 'wayfair.com', yelp: 'yelp.com', target: 'target.com',
  disney: 'disney.com', roblox: 'roblox.com', unity: 'unity.com', 'ea-games': 'ea.com',
  activision: 'activision.com', 'epic-games': 'epicgames.com', reddit: 'reddit.com',
  discord: 'discord.com', plaid: 'plaid.com', brex: 'brex.com', ramp: 'ramp.com',
  rippling: 'rippling.com', 'scale-ai': 'scale.com', 'hugging-face': 'huggingface.co',
  mistral: 'mistral.ai', perplexity: 'perplexity.ai',
  // India
  flipkart: 'flipkart.com', infosys: 'infosys.com', tcs: 'tcs.com', wipro: 'wipro.com',
  zoho: 'zoho.com', cred: 'cred.club', razorpay: 'razorpay.com', meesho: 'meesho.com',
  swiggy: 'swiggy.com', zomato: 'zomato.com', paytm: 'paytm.com', phonepe: 'phonepe.com',
  ola: 'olacabs.com', makemytrip: 'makemytrip.com', freshworks: 'freshworks.com',
};

// Resolve the brand-logo image URL for a company. Prefers the curated slug→domain
// map, then a name-derived guess (lowercase, strip non-alnum, append .com).
export function companyLogoUrl(company) {
  if (!company) return null;
  let domain = COMPANY_WEB_DOMAINS[company.slug];
  if (!domain) {
    const base = String(company.name || company.slug || '')
      .toLowerCase()
      .replace(/\s*\(.*?\)\s*/g, '')
      .split('/')[0]
      .replace(/[^a-z0-9]/g, '');
    if (!base) return null;
    domain = `${base}.com`;
  }
  return `https://logo.clearbit.com/${domain}`;
}

export function getCompanyGroup(slug) {
  return COMPANY_GROUPS[slug] || null;
}

// Resolve a group's member companies from the full catalog.
// When a group declares an `order` (a slug sequence, e.g. the letters of an
// acronym like MANGO → microsoft, apple, nvidia, google, openai), members are
// returned in that exact order so the row reads as the acronym; any matched
// company not listed in `order` falls to the end in catalog order.
export function membersOf(group, companies) {
  if (!group) return [];
  let matched;
  if (typeof group.match === 'function') {
    matched = companies.filter(group.match);
  } else if (Array.isArray(group.slugs)) {
    const set = new Set(group.slugs);
    matched = companies.filter((c) => set.has(c.slug));
  } else {
    return [];
  }
  if (Array.isArray(group.order)) {
    const rank = new Map(group.order.map((slug, i) => [slug, i]));
    const at = (c) => (rank.has(c.slug) ? rank.get(c.slug) : group.order.length);
    return [...matched].sort((a, b) => at(a) - at(b));
  }
  return matched;
}
