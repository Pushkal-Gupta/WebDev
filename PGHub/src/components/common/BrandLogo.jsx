import React from 'react';
import './BrandLogo.css';

// Company -> real full-colour brand SVG. Clearbit was unreliable (404s / blocks),
// so each company below resolves to a verified-live SVG: `si:<slug>` -> Simple
// Icons (https://cdn.simpleicons.org/<slug>), `gb:<slug>` -> gilbarbara/logos on
// jsDelivr. Simple Icons is preferred for full brand colour; gilbarbara fills the
// big brands Simple Icons removed for trademark reasons (Amazon, Adobe, Microsoft,
// Oracle, IBM, LinkedIn, Salesforce, ...). Every value here was re-confirmed 200
// (2026-06; the removed `csharp`/`css3` Simple Icons slugs were repointed — see
// LANGUAGE_SLUGS). Keyed by slug AND normalised display name so both COMPANY_GROUPS
// rows ("google") and free-form labels ("Meta / Facebook") resolve. Companies with
// no reliable brand SVG are omitted and fall through to the clean letter tile.
const SI = 'https://cdn.simpleicons.org';
const GB = 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos';
function logoSrc(spec) {
  if (!spec) return null;
  const [src, slug] = spec.split(':');
  return src === 'gb' ? `${GB}/${slug}.svg` : `${SI}/${slug}`;
}

// Every slug below was curl-verified HTTP 200 with an `<svg>` body against its
// CDN (Simple Icons or gilbarbara), 2026-06. Keys cover the form each company's
// DB `slug` AND display `name` normalise to (the matcher also tries first-token
// + suffix-strip fallbacks), so "Activision Blizzard", "EA Games", "Epic Games",
// "Booking.com", "Twitter / X", "Block (Square)" all resolve. Companies with no
// verified live brand SVG on either CDN (Amazon-the-wordmark, Bloomberg, Canva,
// Disney, Flipkart, Freshworks, Walmart, Wayfair, Workday, ServiceNow, the Indian
// consumer apps Meesho/Ola/MakeMyTrip, the quant funds, etc.) are intentionally
// omitted and fall through to the themed monogram tile.
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
  twitter: 'si:x', x: 'si:x', 'twitter-x': 'si:x',
  tiktok: 'si:tiktok', bytedance: 'si:tiktok', samsung: 'si:samsung',
  oracle: 'gb:oracle', ibm: 'gb:ibm', intel: 'si:intel', cisco: 'si:cisco', amd: 'si:amd',
  qualcomm: 'si:qualcomm', sony: 'si:sony', sap: 'si:sap', dell: 'si:dell',
  paypal: 'si:paypal', stripe: 'si:stripe', salesforce: 'gb:salesforce',
  intuit: 'si:intuit',
  notion: 'si:notion', figma: 'si:figma', github: 'si:github', gitlab: 'si:gitlab',
  slack: 'gb:slack-icon', asana: 'si:asana', linear: 'si:linear', splunk: 'si:splunk',
  square: 'si:square', block: 'si:square',
  shopify: 'si:shopify', ebay: 'si:ebay', coinbase: 'si:coinbase', robinhood: 'si:robinhood',
  openai: 'gb:openai-icon', anthropic: 'si:anthropic',
  // data / infra / dev tools
  snowflake: 'si:snowflake', databricks: 'si:databricks', datadog: 'si:datadog',
  mongodb: 'si:mongodb', cloudflare: 'si:cloudflare', twilio: 'gb:twilio-icon',
  discord: 'si:discord',
  // travel / commerce / consumer / gaming
  doordash: 'si:doordash', roblox: 'si:roblox', unity: 'si:unity',
  visa: 'si:visa', mastercard: 'si:mastercard',
  // commerce / consumer / finance / AI (all re-confirmed 200, 2026-06)
  booking: 'si:bookingdotcom', 'booking-com': 'si:bookingdotcom', bookingcom: 'si:bookingdotcom',
  expedia: 'si:expedia', instacart: 'si:instacart',
  yelp: 'si:yelp', target: 'si:target',
  activision: 'si:activision', 'activision-blizzard': 'si:activision',
  'epic-games': 'si:epicgames', epicgames: 'si:epicgames',
  'ea-games': 'si:ea', ea: 'si:ea',
  vmware: 'si:vmware', elastic: 'si:elastic', hashicorp: 'si:hashicorp',
  'goldman-sachs': 'si:goldmansachs', goldmansachs: 'si:goldmansachs',
  brex: 'si:brex',
  'hugging-face': 'si:huggingface', huggingface: 'si:huggingface',
  mistral: 'si:mistralai', 'mistral-ai': 'si:mistralai', mistralai: 'si:mistralai',
  perplexity: 'si:perplexity',
  // India
  swiggy: 'si:swiggy', zomato: 'si:zomato', paytm: 'si:paytm', phonepe: 'si:phonepe',
  razorpay: 'si:razorpay', infosys: 'si:infosys', tcs: 'si:tcs', wipro: 'si:wipro',
  zoho: 'si:zoho',
};

// Suffix words that are safe to strip when probing the map: "Activision Blizzard"
// -> "activision", "Mistral AI" -> "mistral", "EA Games" -> "ea". Each strip is
// tried as a fallback key, so a future "Foo Technologies" still finds "foo".
const STRIP_SUFFIXES = [
  'blizzard', 'games', 'ai', 'inc', 'incorporated', 'technologies', 'technology',
  'labs', 'studios', 'corp', 'corporation', 'group', 'systems', 'software',
];

// Normalise a free-form company label/slug to a verified brand-SVG URL. Tries,
// in order: the dashed key, the dash-stripped key, the first token ("activision"
// from "activision-blizzard"), and suffix-stripped forms ("mistral" from
// "mistral-ai") — so map keys don't have to anticipate every name decoration.
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

    if (COMPANY_LOGOS[k]) return COMPANY_LOGOS[k];
    if (COMPANY_LOGOS[k.replace(/-/g, '')]) return COMPANY_LOGOS[k.replace(/-/g, '')];

    const tokens = k.split('-').filter(Boolean);
    // First-token fallback: "activision-blizzard" -> "activision".
    if (tokens.length > 1 && COMPANY_LOGOS[tokens[0]]) return COMPANY_LOGOS[tokens[0]];
    // Suffix-strip fallback: drop a trailing generic word and retry.
    if (tokens.length > 1 && STRIP_SUFFIXES.includes(tokens[tokens.length - 1])) {
      const stripped = tokens.slice(0, -1).join('-');
      if (COMPANY_LOGOS[stripped]) return COMPANY_LOGOS[stripped];
      if (COMPANY_LOGOS[stripped.replace(/-/g, '')]) return COMPANY_LOGOS[stripped.replace(/-/g, '')];
    }
    return null;
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
  // Simple Icons removed the `csharp` slug (trademark); gilbarbara serves the
  // full-colour C# mark at `c-sharp` (verified 200).
  'c#': 'gb:c-sharp',
  csharp: 'gb:c-sharp',
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
  // Simple Icons renamed `css3` -> `css` (verified 200; old slug now 404s).
  css: 'css',
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
  // Most language slugs are bare Simple Icons slugs; a few (C#) carry a `gb:`
  // prefix, so route everything through the shared resolver. A bare slug is
  // treated as a Simple Icons slug.
  if (!slug) return null;
  return slug.includes(':') ? logoSrc(slug) : `${SI}/${slug}`;
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

// Renders a brand logo for a company or programming language. The themed
// monogram tile is ALWAYS the base layer, so there is never a blank box: when a
// brand SVG is available it fades in on top once it actually loads. A stalled or
// blocked CDN request (which fires no `error` event) just leaves the monogram
// showing — and a timeout flips to the monogram if the image hasn't loaded in
// time. This is what fixed the "logo not coming" reports: a pending <img> used
// to render nothing.
export default function BrandLogo({ name, slug, kind = 'company', size = 32, className = '' }) {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const src = kind === 'language' ? languageLogoUrl(name) : companyLogoUrl({ name, slug });
  const letter = String(name || '?').trim().charAt(0).toUpperCase() || '?';
  const hue = hueFor(name);

  // If the CDN stalls (no load, no error), fall back to the monogram so the tile
  // is never left blank waiting on a hanging request.
  React.useEffect(() => {
    if (!src || loaded || failed) return undefined;
    const t = setTimeout(() => { if (!loaded) setFailed(true); }, 6000);
    return () => clearTimeout(t);
  }, [src, loaded, failed]);

  // Reset load state when the target logo changes.
  React.useEffect(() => { setLoaded(false); setFailed(false); }, [src]);

  const monogram = (
    <span
      className="brand-logo-mono"
      style={{
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

  // No brand SVG known -> plain monogram tile.
  if (!src || failed) {
    return (
      <span
        className={`brand-logo brand-logo-fallback ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {monogram}
      </span>
    );
  }

  // Monogram base + brand SVG that fades in on successful load.
  return (
    <span
      className={`brand-logo brand-logo-stack ${className}`}
      style={{ width: size, height: size }}
    >
      {!loaded && monogram}
      <img
        className={`brand-logo-img${loaded ? ' is-loaded' : ''}`}
        src={src}
        alt={name || ''}
        width={size}
        height={size}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
