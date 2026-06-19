import React from 'react';
import './BrandLogo.css';

// Company -> real full-colour brand SVG. Clearbit was unreliable (404s / blocks),
// so each company below resolves to a verified-live SVG: `si:<slug>` -> Simple
// Icons (https://cdn.simpleicons.org/<slug>), `gb:<slug>` -> gilbarbara/logos on
// jsDelivr. Simple Icons is preferred for full brand colour; gilbarbara fills the
// big brands Simple Icons removed for trademark reasons (Amazon, Adobe, Microsoft,
// Oracle, IBM, LinkedIn, Salesforce, ...). Every value here was confirmed 200 at
// authoring time. Keyed by slug AND normalised display name so both COMPANY_GROUPS
// rows ("google") and free-form labels ("Meta / Facebook") resolve. Companies with
// no reliable brand SVG are omitted and fall through to the clean letter tile.
const SI = 'https://cdn.simpleicons.org';
const GB = 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos';
function logoSrc(spec) {
  if (!spec) return null;
  const [src, slug] = spec.split(':');
  return src === 'gb' ? `${GB}/${slug}.svg` : `${SI}/${slug}`;
}

const COMPANY_LOGOS = {
  // FAANG + big tech
  google: 'si:google', alphabet: 'si:google',
  meta: 'si:meta', facebook: 'si:facebook', instagram: 'si:instagram', whatsapp: 'si:whatsapp',
  amazon: 'gb:aws', aws: 'gb:aws', 'amazon-web-services': 'gb:aws',
  apple: 'si:apple', netflix: 'si:netflix', nvidia: 'si:nvidia',
  microsoft: 'gb:microsoft-icon',
  adobe: 'gb:adobe', uber: 'si:uber', lyft: 'si:lyft', atlassian: 'si:atlassian',
  airbnb: 'si:airbnb', tesla: 'si:tesla', spotify: 'si:spotify', dropbox: 'si:dropbox',
  pinterest: 'si:pinterest', reddit: 'si:reddit', twitch: 'si:twitch',
  snap: 'si:snapchat', snapchat: 'si:snapchat', linkedin: 'gb:linkedin-icon',
  twitter: 'si:x', x: 'si:x',
  tiktok: 'si:tiktok', bytedance: 'si:tiktok', samsung: 'si:samsung',
  oracle: 'gb:oracle', ibm: 'gb:ibm', intel: 'si:intel', cisco: 'si:cisco', amd: 'si:amd',
  qualcomm: 'si:qualcomm', sony: 'si:sony', sap: 'si:sap', dell: 'si:dell',
  paypal: 'si:paypal', stripe: 'si:stripe', salesforce: 'gb:salesforce',
  notion: 'si:notion', figma: 'si:figma', github: 'si:github', gitlab: 'si:gitlab',
  slack: 'gb:slack-icon',
  shopify: 'si:shopify', ebay: 'si:ebay', coinbase: 'si:coinbase', robinhood: 'si:robinhood',
  openai: 'gb:openai-icon', anthropic: 'si:anthropic',
  // data / infra / dev tools
  snowflake: 'si:snowflake', databricks: 'si:databricks', datadog: 'si:datadog',
  mongodb: 'si:mongodb', cloudflare: 'si:cloudflare', twilio: 'gb:twilio-icon',
  discord: 'si:discord',
  // travel / commerce / consumer / gaming
  doordash: 'si:doordash', roblox: 'si:roblox', unity: 'si:unity',
  visa: 'si:visa', mastercard: 'si:mastercard',
  // India
  swiggy: 'si:swiggy', zomato: 'si:zomato', paytm: 'si:paytm', phonepe: 'si:phonepe',
  razorpay: 'si:razorpay',
};

// Normalise a free-form company label/slug to a verified brand-SVG URL.
function companyLogoUrl({ name, slug } = {}) {
  const tryKey = (raw) => {
    if (!raw) return null;
    const k = String(raw)
      .toLowerCase()
      .replace(/\s*\(.*?\)\s*/g, '')
      .split('/')[0]
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!k) return null;
    return COMPANY_LOGOS[k] || COMPANY_LOGOS[k.replace(/-/g, '')] || null;
  };
  return logoSrc(tryKey(slug) || tryKey(name));
}

// Programming-language (and a few tools) -> Simple Icons slug. Simple Icons
// serves full-colour brand SVGs at https://cdn.simpleicons.org/<slug>.
const LANGUAGE_SLUGS = {
  python: 'python',
  java: 'openjdk',
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  c: 'c',
  'c++': 'cplusplus',
  cpp: 'cplusplus',
  cplusplus: 'cplusplus',
  'c#': 'csharp',
  csharp: 'csharp',
  go: 'go',
  golang: 'go',
  rust: 'rust',
  kotlin: 'kotlin',
  swift: 'swift',
  ruby: 'ruby',
  php: 'php',
  scala: 'scala',
  r: 'r',
  sql: 'mysql',
  bash: 'gnubash',
  shell: 'gnubash',
  html: 'html5',
  css: 'css3',
  dart: 'dart',
  perl: 'perl',
  haskell: 'haskell',
  lua: 'lua',
};

// Normalise a free-form language label ("C++ Basics", "Python") to its slug.
function languageSlug(name) {
  if (!name) return null;
  const key = String(name)
    .toLowerCase()
    .replace(/\bbasics\b|\bcourse\b|\bprogramming\b/g, '')
    .trim()
    .replace(/\s+/g, '');
  return LANGUAGE_SLUGS[key] || LANGUAGE_SLUGS[key.replace(/[^a-z0-9+#]/g, '')] || null;
}

function languageLogoUrl(name) {
  const slug = languageSlug(name);
  return slug ? `https://cdn.simpleicons.org/${slug}` : null;
}

// Stable hash so a given name always maps to the same accent hue tile.
const FALLBACK_HUES = [
  'var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)',
  'var(--accent)', 'var(--easy)', 'var(--medium)', 'var(--hard)',
];
function hueFor(name) {
  const s = String(name || '?');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return FALLBACK_HUES[h % FALLBACK_HUES.length];
}

// Renders a brand logo for a company or programming language with a clean
// letter-tile fallback (never a broken-image icon).
export default function BrandLogo({ name, slug, kind = 'company', size = 32, className = '' }) {
  const [failed, setFailed] = React.useState(false);

  let src = null;
  if (!failed) {
    src = kind === 'language' ? languageLogoUrl(name) : companyLogoUrl({ name, slug });
  }

  if (!src) {
    const letter = String(name || '?').trim().charAt(0).toUpperCase() || '?';
    const hue = hueFor(name);
    return (
      <span
        className={`brand-logo brand-logo-fallback ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: Math.round(size * 0.46),
          color: hue,
          background: `color-mix(in srgb, ${hue} 16%, var(--hover-box))`,
          borderColor: `color-mix(in srgb, ${hue} 36%, var(--border))`,
        }}
        aria-hidden="true"
      >
        {letter}
      </span>
    );
  }

  return (
    <img
      className={`brand-logo brand-logo-img ${className}`}
      src={src}
      alt={name || ''}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
