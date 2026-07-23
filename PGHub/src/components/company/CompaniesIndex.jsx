import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, ArrowRight, MapPin, Star, Layers,
  Sparkles, Rocket, Landmark, Briefcase, LineChart, Cloud, Search, X,
} from 'lucide-react';
import { useCompanies } from '../../lib/queries';
import { COMPANY_GROUPS, membersOf } from '../../content/companyGroups';
import BrandLogo from '../common/BrandLogo';
import './Companies.css';

const GROUP_ICONS = { Sparkles, Building2, Rocket, Landmark, Briefcase, MapPin, Star, LineChart, Cloud };

export function CompanyLogo({ c }) {
  return <BrandLogo kind="company" name={c.name} slug={c.slug} />;
}

export default function CompaniesIndex() {
  const { data: companies = [], isLoading } = useCompanies();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) return null;
    return companies
      .filter((c) => [c.name, c.tagline, c.domain, c.hq, c.region].filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(query)))
      .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
  }, [query, companies]);

  const grouped = useMemo(() => {
    const featured = companies.filter(c => c.is_featured);
    const byRegion = {};
    companies.filter(c => !c.is_featured).forEach(c => {
      const r = c.region || 'global';
      if (!byRegion[r]) byRegion[r] = [];
      byRegion[r].push(c);
    });
    return { featured, byRegion };
  }, [companies]);

  const groupCounts = useMemo(() => {
    const out = {};
    Object.entries(COMPANY_GROUPS).forEach(([slug, g]) => {
      out[slug] = membersOf(g, companies).length;
    });
    return out;
  }, [companies]);

  if (isLoading) {
    return (
      <div className="comp-container">
        <div className="comp-skeleton">
          <div className="skel skel-text" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="comp-container">
        <div className="comp-empty">
          <Building2 size={32} className="comp-empty-icon" />
          <h2 className="comp-empty-title">No companies yet</h2>
          <p className="comp-empty-sub">
            Company-tagged problem lists land here as they go live.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="comp-container">
      <header className="comp-header">
        <h1 className="comp-title"><span className="comp-title-pre">PG</span>Career</h1>
        <p className="comp-sub">
          {companies.length} companies with their most-asked interview problems, ranked by frequency.
        </p>
        <div className="comp-search">
          <Search size={16} className="comp-search-icon" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search companies by name, domain, or location…"
            aria-label="Search companies"
          />
          {q ? <button className="comp-search-clear" onClick={() => setQ('')} aria-label="Clear search"><X size={15} /></button> : null}
        </div>
      </header>

      {results ? (
        <div className="comp-sections">
          <section className="comp-section">
            <h2 className="comp-section-title">{results.length} result{results.length === 1 ? '' : 's'} for “{q.trim()}”</h2>
            {results.length ? (
              <div className="comp-grid">{results.map((c) => <CompanyCard key={c.slug} c={c} />)}</div>
            ) : (
              <div className="comp-empty">
                <Building2 size={28} className="comp-empty-icon" />
                <p className="comp-empty-sub">No companies match “{q.trim()}”. Try a different name or domain.</p>
              </div>
            )}
          </section>
        </div>
      ) : (
      <div className="comp-sections">
      <section className="comp-section">
        <h2 className="comp-section-title">Browse by group</h2>
        <div className="comp-group-grid">
          {Object.entries(COMPANY_GROUPS).map(([slug, g]) => {
            const Icon = GROUP_ICONS[g.iconName] || Building2;
            const n = groupCounts[slug] || 0;
            const hueVar = g.hue && g.hue !== 'accent' ? `var(--hue-${g.hue})` : 'var(--accent)';
            return (
              <Link
                key={slug}
                to={`/company/g/${slug}`}
                className="comp-card comp-group-card"
                style={{ '--group-hue': hueVar }}
              >
                <div className="comp-card-head">
                  <span className="comp-card-iconbox comp-group-iconbox"><Icon size={18} /></span>
                  <h3 className="comp-card-title">{g.title}</h3>
                  {g.acronym && <span className="comp-group-acronym">{g.acronym}</span>}
                  <Layers size={11} className="comp-group-card-badge" />
                </div>
                <p className="comp-card-desc">{g.summary}</p>
                <div className="comp-card-foot">
                  <span className="comp-card-meta">{n} compan{n === 1 ? 'y' : 'ies'}</span>
                  <ArrowRight size={13} className="comp-card-arrow" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {grouped.featured.length > 0 && (
        <section className="comp-section">
          <h2 className="comp-section-title">Featured</h2>
          <div className="comp-grid">
            {grouped.featured.map(c => <CompanyCard key={c.slug} c={c} />)}
          </div>
        </section>
      )}

      {Object.entries(grouped.byRegion).map(([region, items]) => (
        <section key={region} className="comp-section">
          <h2 className="comp-section-title">{region === 'india' ? 'India' : region.charAt(0).toUpperCase() + region.slice(1)}</h2>
          <div className="comp-grid">
            {items.map(c => <CompanyCard key={c.slug} c={c} />)}
          </div>
        </section>
      ))}
      </div>
      )}
    </div>
  );
}

function CompanyCard({ c }) {
  return (
    <Link to={`/company/${c.slug}`} className="comp-card">
      <div className="comp-card-head">
        <CompanyLogo c={c} />
        <h3 className="comp-card-title">{c.name}</h3>
        {c.is_featured && <Star size={11} className="comp-card-star" />}
      </div>
      {c.tagline && <p className="comp-card-desc">{c.tagline}</p>}
      <div className="comp-card-foot">
        {c.hq && <span className="comp-card-meta"><MapPin size={10} /> {c.hq}</span>}
        {c.domain && <span className="comp-card-chip">{c.domain}</span>}
        <ArrowRight size={13} className="comp-card-arrow" />
      </div>
    </Link>
  );
}
