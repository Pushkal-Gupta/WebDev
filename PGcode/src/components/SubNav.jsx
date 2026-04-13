import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, List, RotateCcw } from 'lucide-react';
import './SubNav.css';

export default function SubNav({ reviewCount }) {
  return (
    <nav className="sub-nav">
      <div className="sub-nav-inner">
        <NavLink to="/" end className={({ isActive }) => `sub-nav-link ${isActive ? 'active' : ''}`}>
          <Map size={14} />
          <span>Roadmap</span>
        </NavLink>
        <NavLink to="/problems" className={({ isActive }) => `sub-nav-link ${isActive ? 'active' : ''}`}>
          <List size={14} />
          <span>Problems</span>
        </NavLink>
        <NavLink to="/review" className={({ isActive }) => `sub-nav-link ${isActive ? 'active' : ''}`}>
          <RotateCcw size={14} />
          <span>Review</span>
          {reviewCount > 0 && <span className="sub-nav-badge">{reviewCount}</span>}
        </NavLink>
      </div>
    </nav>
  );
}
