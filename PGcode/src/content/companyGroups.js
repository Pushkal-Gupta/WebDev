// Company group definitions — landing tabs that filter the company catalog.
// Each group resolves to its members either by explicit `slugs` or by a
// `match(company)` predicate over the row fields (domain, region, slug, name).
// Mirrors the ML group pattern (src/content/mlGroups.js): a hub of cards, each
// opening a filtered list page at /company/g/:groupSlug.

const has = (set) => (c) => set.has(c.slug);

export const COMPANY_GROUPS = {
  faang: {
    iconName: 'Sparkles',
    title: 'FAANG',
    summary: 'The five that set the interview bar — Meta, Amazon, Apple, Netflix, Google.',
    match: has(new Set(['meta', 'facebook', 'amazon', 'apple', 'netflix', 'google'])),
  },
  'big-tech': {
    iconName: 'Building2',
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
    iconName: 'Landmark',
    title: 'Fintech & Quant',
    summary: 'Payments, trading, and quant shops — correctness, latency, and numeric edge cases bite hardest here.',
    match: (c) => ['Fintech', 'Finance'].includes(c.domain)
      || ['stripe', 'square', 'coinbase', 'robinhood', 'plaid', 'brex', 'ramp',
          'citadel', 'two-sigma', 'jane-street', 'hudson-river', 'jp-morgan',
          'morgan-stanley', 'goldman-sachs'].includes(c.slug),
  },
  enterprise: {
    iconName: 'Briefcase',
    title: 'Enterprise & Cloud',
    summary: 'B2B SaaS and cloud platforms — API design, multi-tenancy, and reliability questions.',
    match: (c) => c.domain === 'Enterprise'
      || ['salesforce', 'workday', 'servicenow', 'sap', 'oracle', 'atlassian',
          'snowflake', 'databricks', 'mongodb', 'datadog', 'twilio'].includes(c.slug),
  },
  india: {
    iconName: 'MapPin',
    title: 'India',
    summary: 'Product and services companies hiring across India — from startups to the global majors local offices.',
    match: (c) => c.region === 'india',
  },
};

export function getCompanyGroup(slug) {
  return COMPANY_GROUPS[slug] || null;
}

// Resolve a group's member companies from the full catalog.
export function membersOf(group, companies) {
  if (!group) return [];
  if (typeof group.match === 'function') return companies.filter(group.match);
  if (Array.isArray(group.slugs)) {
    const set = new Set(group.slugs);
    return companies.filter((c) => set.has(c.slug));
  }
  return [];
}
