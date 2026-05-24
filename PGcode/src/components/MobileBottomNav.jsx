import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Map, List, Terminal, BookOpen, Library } from 'lucide-react';
import './MobileBottomNav.css';

const ITEMS = [
  { to: '/',           end: true, icon: Map,      label: 'Roadmap' },
  { to: '/practice',              icon: List,     label: 'Practice' },
  { to: '/playground',            icon: Terminal, label: 'Playground' },
  { to: '/tutorial',              icon: BookOpen, label: 'Tutorial' },
  { to: '/learn',                 icon: Library,  label: 'Concepts' },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const hideOnRoute =
    pathname.startsWith('/category') || pathname.startsWith('/playground');
  if (hideOnRoute) return null;

  return (
    <nav className="mbn" aria-label="Primary mobile navigation">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `mbn-link ${isActive ? 'active' : ''}`}
          >
            <span className="mbn-indicator" aria-hidden="true" />
            <Icon size={21} strokeWidth={2} />
            <span className="mbn-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
