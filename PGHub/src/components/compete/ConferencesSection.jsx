import { Link } from 'react-router-dom';
import { ChevronRight, Presentation, MapPin, CalendarDays, Tag, ExternalLink } from 'lucide-react';
import './LaunchSections.css';

const CONFERENCES = [
  {
    name: 'NeurIPS',
    badge: 'ML Research',
    when: 'Annual · December',
    where: 'Rotating · North America',
    desc: 'The largest gathering for machine-learning research — new architectures, theory, and benchmarks land here first.',
    tags: ['deep learning', 'theory', 'research'],
    url: 'https://neurips.cc',
  },
  {
    name: 'ICML',
    badge: 'ML Research',
    when: 'Annual · July',
    where: 'Rotating · Global',
    desc: 'A flagship venue for core machine-learning work, from optimization and probabilistic models to applied breakthroughs.',
    tags: ['optimization', 'models', 'research'],
    url: 'https://icml.cc',
  },
  {
    name: 'ICLR',
    badge: 'Deep Learning',
    when: 'Annual · April / May',
    where: 'Rotating · Global',
    desc: 'Focused on representation learning — the home of much of the deep-learning work that defines the field each year.',
    tags: ['representations', 'deep learning'],
    url: 'https://iclr.cc',
  },
  {
    name: 'CVPR',
    badge: 'Computer Vision',
    when: 'Annual · June',
    where: 'Rotating · North America',
    desc: 'The premier computer-vision conference covering detection, generation, 3D, and the latest in visual understanding.',
    tags: ['vision', 'generative', '3d'],
    url: 'https://cvpr.thecvf.com',
  },
  {
    name: 'KDD',
    badge: 'Data Mining',
    when: 'Annual · August',
    where: 'Rotating · Global',
    desc: 'Where data mining meets production scale — recommendation, graph learning, and applied ML at industry volume.',
    tags: ['data mining', 'recsys', 'graphs'],
    url: 'https://www.kdd.org',
  },
  {
    name: 'PyCon',
    badge: 'Python',
    when: 'Annual · Spring',
    where: 'Rotating · Regional editions',
    desc: 'The community conference for Python — language internals, tooling, packaging, and the libraries you build on daily.',
    tags: ['python', 'tooling', 'community'],
    url: 'https://pycon.org',
  },
  {
    name: 'JSConf',
    badge: 'JavaScript',
    when: 'Annual · Multiple editions',
    where: 'Rotating · Global',
    desc: 'A grassroots gathering for the JavaScript world — runtimes, frameworks, and the web platform pushed forward.',
    tags: ['javascript', 'web', 'runtimes'],
    url: 'https://jsconf.com',
  },
  {
    name: 'QCon',
    badge: 'Software Architecture',
    when: 'Annual · Multiple editions',
    where: 'Major tech hubs',
    desc: 'Practitioner-led talks on distributed systems, architecture, and the engineering tradeoffs behind large platforms.',
    tags: ['architecture', 'distributed', 'scale'],
    url: 'https://qconferences.com',
  },
  {
    name: 'Strange Loop-style systems track',
    badge: 'Systems',
    when: 'Annual · Autumn',
    where: 'Regional gatherings',
    desc: 'Deep, ideas-first talks spanning languages, databases, and concurrency — the corners of computing that rarely fit elsewhere.',
    tags: ['languages', 'databases', 'concurrency'],
    url: null,
  },
];

export default function ConferencesSection() {
  return (
    <div className="lnch">
      <nav className="lnch-crumbs">
        <Link to="/compete">PGBattle</Link>
        <ChevronRight size={11} />
        <span>Conferences</span>
      </nav>

      <header className="lnch-head">
        <h1 className="lnch-title"><Presentation size={26} /> Conferences</h1>
        <p className="lnch-sub">Recurring research and engineering conferences worth tracking — where the field's next ideas get presented.</p>
      </header>

      <div className="lnch-grid">
        {CONFERENCES.map((c) => (
          <article key={c.name} className="lnch-card">
            <div className="lnch-card-head">
              <span className="lnch-badge"><Presentation size={11} /> {c.badge}</span>
            </div>
            <h2 className="lnch-card-name">{c.name}</h2>
            <p className="lnch-card-desc">{c.desc}</p>
            <div className="lnch-chips">
              <span className="lnch-chip"><CalendarDays size={11} /> {c.when}</span>
              <span className="lnch-chip"><MapPin size={11} /> {c.where}</span>
              {c.tags.map((t) => <span key={t} className="lnch-chip tag"><Tag size={10} /> {t}</span>)}
            </div>
            {c.url && (
              <div className="lnch-card-foot">
                <span className="lnch-meta"><CalendarDays size={12} /> {c.when.replace('Annual · ', '')}</span>
                <a className="lnch-cta" href={c.url} target="_blank" rel="noreferrer">
                  View <ExternalLink size={12} />
                </a>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
