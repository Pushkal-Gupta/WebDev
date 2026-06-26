import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import './Breadcrumb.css';

// Canonical "back" nav for every nested route. Pass the full path as
// items=[{label, to}, ...]; the LAST item is the current page (rendered
// inert). The first linked item gets a leading ArrowLeft so there's always
// an obvious way back up the hierarchy. Render this as the first child in
// EVERY render branch (signed-out / loading / error / empty / normal) so the
// back nav never disappears.
export default function Breadcrumb({ items = [], className = '' }) {
  if (!items.length) return null;
  const backTo = items.find((it) => it.to)?.to;

  return (
    <nav className={`pg-crumbs ${className}`.trim()} aria-label="Breadcrumb">
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        const isFirstLink = it.to && it.to === backTo && i === items.findIndex((x) => x.to);
        return (
          <React.Fragment key={`${it.label}-${i}`}>
            {i > 0 && <ChevronRight size={12} className="pg-crumbs-sep" aria-hidden="true" />}
            {it.to && !isLast ? (
              <Link to={it.to} className="pg-crumbs-link">
                {isFirstLink && <ArrowLeft size={12} className="pg-crumbs-arrow" aria-hidden="true" />}
                {it.label}
              </Link>
            ) : (
              <span className={isLast ? 'pg-crumbs-current' : 'pg-crumbs-link'}>{it.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
