import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Lightbulb } from 'lucide-react';
import { RESOURCE_GROUPS, RESOURCE_TIPS } from './resourcesData';
import Breadcrumb from '../../common/Breadcrumb';
import './CompeteResources.css';

export default function CompeteResources() {
  return (
    <div className="res-page">
      <Breadcrumb items={[{ label: 'Compete', to: '/compete' }, { label: 'Resources' }]} />
      <header className="res-head">
        <h1 className="res-title"><BookOpen size={24} /> Resources</h1>
        <p className="res-sub">A shelf for everything around competing — foundations, practice, interview prep, and open-source paths, all linked in one place.</p>
      </header>

      <section className="res-grid">
        {RESOURCE_GROUPS.map((g) => (
          <article key={g.key} className="res-card" style={{ '--card-hue': g.hue }}>
            <h2 className="res-card-title">{g.title}</h2>
            <p className="res-card-blurb">{g.blurb}</p>
            <ul className="res-links">
              {g.items.map((it) => (
                <li key={it.label}>
                  <Link to={it.to} className="res-link">
                    <span>{it.label}</span>
                    <ArrowRight size={13} />
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="res-tips">
        <div className="res-tips-head"><Lightbulb size={15} /> Contest habits that compound</div>
        <div className="res-tips-grid">
          {RESOURCE_TIPS.map((t) => (
            <div key={t.title} className="res-tip">
              <span className="res-tip-title">{t.title}</span>
              <span className="res-tip-detail">{t.detail}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
