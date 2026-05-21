import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, BookOpen, List, Terminal, TrendingUp } from 'lucide-react';
import './MobileBottomNav.css';

// Only visible on phone-width viewports. Same destinations are reachable via
// the horizontal SubNav above; this just gives thumb-friendly access on mobile.
export default function MobileBottomNav() {
  return (
    <nav className="mbn" aria-label="Primary mobile navigation">
      <NavLink to="/" end className={({ isActive }) => `mbn-link ${isActive ? 'active' : ''}`}>
        <Map size={16} />
        <span>Roadmap</span>
      </NavLink>
      <NavLink to="/learn" className={({ isActive }) => `mbn-link ${isActive ? 'active' : ''}`}>
        <BookOpen size={16} />
        <span>Learn</span>
      </NavLink>
      <NavLink to="/practice" className={({ isActive }) => `mbn-link ${isActive ? 'active' : ''}`}>
        <List size={16} />
        <span>Practice</span>
      </NavLink>
      <NavLink to="/playground" className={({ isActive }) => `mbn-link ${isActive ? 'active' : ''}`}>
        <Terminal size={16} />
        <span>Play</span>
      </NavLink>
      <NavLink to="/progress" className={({ isActive }) => `mbn-link ${isActive ? 'active' : ''}`}>
        <TrendingUp size={16} />
        <span>Progress</span>
      </NavLink>
    </nav>
  );
}
