-- Phase 7 (partial): company pages.
-- Each company gets a slug and metadata; problems are tied to companies via a
-- weighted M2M so "frequency" can drive sorting on company-detail pages.

CREATE TABLE IF NOT EXISTS public."PGcode_companies" (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  domain TEXT,
  region TEXT,
  hq TEXT,
  position INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."PGcode_company_problems" (
  company_slug TEXT REFERENCES public."PGcode_companies"(slug) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  frequency_score INT NOT NULL DEFAULT 0,  -- 0..100, higher = more frequent
  last_asked_year INT,
  role TEXT,  -- optional: 'sde1' | 'sde2' | 'intern' | etc.
  PRIMARY KEY (company_slug, problem_id, role)
);

CREATE INDEX IF NOT EXISTS idx_company_problems_company
  ON public."PGcode_company_problems"(company_slug, frequency_score DESC);

-- Seed the canonical 8 + Indian-tier add-ons (per the master prompt). Slugs are
-- stable; titles can drift. is_featured controls "Featured" vs "All" grouping.
INSERT INTO public."PGcode_companies" (slug, name, tagline, domain, region, hq, position, is_featured) VALUES
  ('google',      'Google',     'Search, ML, distributed systems, browser, ads, cloud.', 'Big Tech',   'global',  'Mountain View, CA', 1, true),
  ('meta',        'Meta',       'Social, AR/VR, ML, infra at scale.',                    'Big Tech',   'global',  'Menlo Park, CA',    2, true),
  ('amazon',      'Amazon',     'E-commerce, AWS, hardware, leadership principles.',     'Big Tech',   'global',  'Seattle, WA',       3, true),
  ('microsoft',   'Microsoft',  'Windows, Office, Azure, GitHub, gaming.',               'Big Tech',   'global',  'Redmond, WA',       4, true),
  ('apple',       'Apple',      'Devices, OS, services, silicon.',                       'Big Tech',   'global',  'Cupertino, CA',     5, true),
  ('adobe',       'Adobe',      'Creative tools, cloud documents, ML.',                  'Tech',       'global',  'San Jose, CA',      6, true),
  ('uber',        'Uber',       'Mobility, delivery, geospatial systems.',               'Tech',       'global',  'San Francisco, CA', 7, true),
  ('netflix',     'Netflix',    'Streaming, content systems, distributed playback.',     'Tech',       'global',  'Los Gatos, CA',     8, true),
  ('atlassian',   'Atlassian',  'Developer + collaboration tools (Jira, Confluence).',   'Tech',       'global',  'Sydney, AU',        9, false),
  ('bloomberg',   'Bloomberg',  'Financial data, trading, real-time analytics.',         'Finance',    'global',  'New York, NY',      10, false),
  ('goldman-sachs','Goldman Sachs','Investment banking, trading systems, quant.',         'Finance',    'global',  'New York, NY',      11, false),
  ('walmart',     'Walmart',    'Retail, supply chain, e-commerce.',                     'Retail',     'global',  'Bentonville, AR',   12, false),
  ('oracle',      'Oracle',     'Databases, cloud, enterprise software.',                'Enterprise', 'global',  'Austin, TX',        13, false),
  ('paypal',      'PayPal',     'Payments, fraud detection, risk.',                      'Finance',    'global',  'San Jose, CA',      14, false),
  ('servicenow',  'ServiceNow', 'Enterprise workflow automation.',                       'Enterprise', 'global',  'Santa Clara, CA',   15, false),
  ('intuit',      'Intuit',     'Tax, accounting, personal finance.',                    'Finance',    'global',  'Mountain View, CA', 16, false),
  ('flipkart',    'Flipkart',   'E-commerce, payments, logistics in India.',             'Tech',       'india',   'Bengaluru, India',  17, false),
  ('razorpay',    'Razorpay',   'Payments + banking infra for Indian businesses.',       'Fintech',    'india',   'Bengaluru, India',  18, false),
  ('swiggy',      'Swiggy',     'Food delivery + groceries.',                            'Tech',       'india',   'Bengaluru, India',  19, false),
  ('zomato',      'Zomato',     'Food delivery + restaurant discovery.',                 'Tech',       'india',   'Gurugram, India',   20, false),
  ('meesho',      'Meesho',     'Social commerce.',                                      'Tech',       'india',   'Bengaluru, India',  21, false),
  ('cred',        'CRED',       'Credit card payments + member rewards.',                'Fintech',    'india',   'Bengaluru, India',  22, false),
  ('zoho',        'Zoho',       'SaaS suite, developer-first culture.',                  'Tech',       'india',   'Chennai, India',    23, false),
  ('samsung',     'Samsung',    'Devices, semiconductors, displays.',                    'Hardware',   'global',  'Suwon, South Korea',24, false),
  ('de-shaw',     'D.E. Shaw',  'Quantitative finance, computational research.',         'Finance',    'global',  'New York, NY',      25, false),
  ('tower-research','Tower Research','High-frequency trading.',                         'Finance',    'global',  'New York, NY',      26, false),
  ('tcs',         'TCS',        'IT services, large-scale consulting.',                  'Services',   'india',   'Mumbai, India',     27, false),
  ('infosys',     'Infosys',    'IT services + business consulting.',                    'Services',   'india',   'Bengaluru, India',  28, false),
  ('wipro',       'Wipro',      'IT services + BPO.',                                    'Services',   'india',   'Bengaluru, India',  29, false)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  domain = EXCLUDED.domain,
  region = EXCLUDED.region,
  hq = EXCLUDED.hq,
  position = EXCLUDED.position,
  is_featured = EXCLUDED.is_featured;
