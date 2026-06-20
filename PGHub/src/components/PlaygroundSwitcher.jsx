import React from 'react';
import { NavLink } from 'react-router-dom';
import { Terminal, Globe, Database } from 'lucide-react';
import './PlaygroundSwitcher.css';

// Shown on every playground page so the user can jump between the three
// playgrounds (Compiler, Web, SQL) without going back to /playground first.
export default function PlaygroundSwitcher({ current }) {
  const items = [
    { id: 'code', label: 'Compiler', to: '/playground', icon: Terminal },
    { id: 'web',  label: 'Web',      to: '/playground/web', icon: Globe },
    { id: 'sql',  label: 'SQL',      to: '/playground/sql', icon: Database },
  ];

  return (
    <nav className="pg-switcher" aria-label="Playground type">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.id === 'code'}
            className={({ isActive }) =>
              `pg-switcher-pill ${isActive || current === item.id ? 'active' : ''}`
            }
          >
            <Icon size={12} /> {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
