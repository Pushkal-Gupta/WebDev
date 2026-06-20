import React, { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronRight, Grid3x3, Flame, Cpu, Zap, Brain, FileText } from 'lucide-react';
import { getSheet } from './pgForgeSheetsData';
import './PGForgeSheetDetail.css';

const ICONS = { Grid3x3, Flame, Cpu, Zap, Brain };

export default function PGForgeSheetDetail() {
  const { slug } = useParams();
  const sheet = useMemo(() => getSheet(slug), [slug]);

  if (!sheet) return <Navigate to="/ml/sheets" replace />;

  const Icon = ICONS[sheet.icon] || FileText;

  return (
    <div className="forge-shd">
      <nav className="forge-crumb">
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        <Link to="/ml/sheets" className="forge-crumb-link">Sheets</Link>
        <ChevronRight size={13} />
        <span className="forge-crumb-cur">{sheet.title}</span>
      </nav>

      <header className="forge-shd-header">
        <h1 className="forge-shd-title">
          <Icon size={22} className="forge-shd-title-icon" />
          {sheet.title}
        </h1>
        <p className="forge-shd-blurb">{sheet.blurb}</p>
      </header>

      <div className="forge-shd-grid">
        {sheet.sections.map((section) => (
          <section key={section.heading} className="forge-shd-section">
            <h2 className="forge-shd-sec-head">{section.heading}</h2>
            <ul className="forge-shd-items">
              {section.items.map((item) => (
                <li key={item.label} className="forge-shd-item">
                  <span className="forge-shd-item-label">{item.label}</span>
                  <pre className="forge-shd-code"><code>{item.code}</code></pre>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
