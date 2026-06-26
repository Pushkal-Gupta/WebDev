import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight, Building2, MapPin, Star,
  Sparkles, Rocket, Landmark, Briefcase, LineChart, Cloud,
} from 'lucide-react';
import { useCompanies } from '../../lib/queries';
import { getCompanyGroup, membersOf } from '../../content/companyGroups';
import { CompanyLogo } from './CompaniesIndex';
import Breadcrumb from '../common/Breadcrumb';
import './Companies.css';

const ICONS = { Sparkles, Building2, Rocket, Landmark, Briefcase, MapPin, Star, LineChart, Cloud };

export default function CompanyGroup() {
  const { groupSlug } = useParams();
  const { data: companies = [], isLoading } = useCompanies();
  const group = getCompanyGroup(groupSlug);

  const members = useMemo(() => membersOf(group, companies), [group, companies]);

  if (!group) {
    return (
      <div className="comp-container">
        <Breadcrumb items={[{ label: 'Companies', to: '/company' }, { label: 'Group' }]} />
        <div className="comp-empty">
          <Building2 size={32} className="comp-empty-icon" />
          <h2 className="comp-empty-title">Group not found</h2>
        </div>
      </div>
    );
  }

  const GroupIcon = ICONS[group.iconName] || Building2;
  const groupHue = group.hue && group.hue !== 'accent' ? `var(--hue-${group.hue})` : 'var(--accent)';

  return (
    <div className="comp-container">
      <Breadcrumb items={[{ label: 'Companies', to: '/company' }, { label: group.title }]} />

      <header className="comp-detail-header">
        <div className="comp-detail-title-row">
          <GroupIcon size={22} className="comp-detail-icon" style={{ color: groupHue }} />
          <h1 className="comp-detail-title">{group.title}</h1>
        </div>
        <p className="comp-detail-tagline">{group.summary}</p>
        <div className="comp-detail-meta">
          <span className="comp-detail-meta-chip">{members.length} compan{members.length === 1 ? 'y' : 'ies'}</span>
        </div>
      </header>

      {isLoading ? (
        <div className="comp-skeleton">
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
        </div>
      ) : members.length === 0 ? (
        <div className="comp-empty">
          <p className="comp-empty-sub">No companies in this group yet.</p>
        </div>
      ) : (
        <div className="comp-grid comp-group-members">
          {members.map((c) => (
            <Link key={c.slug} to={`/company/${c.slug}`} className="comp-card">
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
          ))}
        </div>
      )}
    </div>
  );
}
