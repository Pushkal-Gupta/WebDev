import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight, MapPin, Star } from 'lucide-react';
import { useCompanies } from '../../lib/queries';
import './Companies.css';

export default function CompaniesIndex() {
  const { data: companies = [], isLoading } = useCompanies();

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
            Company-tagged problem lists haven't been seeded yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="comp-container">
      <header className="comp-header">
        <h1 className="comp-title">Companies</h1>
        <p className="comp-sub">
          Interview-prep packs for {companies.length} companies. Each company page surfaces the most-frequently-asked
          problems sorted by frequency score.
        </p>
      </header>

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
  );
}

function CompanyCard({ c }) {
  return (
    <Link to={`/company/${c.slug}`} className="comp-card">
      <div className="comp-card-head">
        <Building2 size={14} className="comp-card-icon" />
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
