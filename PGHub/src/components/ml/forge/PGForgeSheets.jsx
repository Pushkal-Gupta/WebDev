import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, Grid3x3, Flame, Cpu, Zap, Brain, FileText } from 'lucide-react';
import { PG_FORGE_SHEETS } from './pgForgeSheetsData';
import ForgeThumb from './ForgeThumb';
import './PGForgeSheets.css';

const ICONS = { Grid3x3, Flame, Cpu, Zap, Brain };

const THUMB_KINDS = {
  numpy: 'matrix',
  pytorch: 'network',
  cuda: 'cuda',
  triton: 'cuda',
  'cracking-ml': 'cards',
};

export default function PGForgeSheets() {
  return (
    <div className="forge-sh">
      <nav className="forge-crumb">
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        <span className="forge-crumb-cur">Sheets</span>
      </nav>

      <header className="forge-sh-header">
        <h1 className="forge-sh-title">Reference sheets</h1>
        <p className="forge-sh-sub">
          The calls and concepts you reach for mid-task, on one page each — scan, copy, and get back to work.
        </p>
      </header>

      <div className="forge-sh-grid">
        {PG_FORGE_SHEETS.map((sheet) => {
          const Icon = ICONS[sheet.icon] || FileText;
          return (
            <Link key={sheet.slug} to={`/ml/sheets/${sheet.slug}`} className="forge-sh-card">
              <div className="forge-thumb-frame forge-sh-card-thumb">
                <ForgeThumb kind={THUMB_KINDS[sheet.slug] || 'auto'} seed={sheet.title} label={sheet.title} />
              </div>
              <div className="forge-sh-card-body">
                <div className="forge-sh-card-head">
                  <Icon size={16} className="forge-sh-card-icon" />
                  <h2 className="forge-sh-card-title">{sheet.title}</h2>
                </div>
                <p className="forge-sh-card-blurb">{sheet.blurb}</p>
                <div className="forge-sh-card-foot">
                  <span className="forge-sh-open">Open</span>
                  <ArrowRight size={15} className="forge-sh-card-arrow" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
