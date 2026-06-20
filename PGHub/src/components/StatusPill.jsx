import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Circle, CheckCircle2, Star, RotateCcw, Award, Edit3 } from 'lucide-react';
import { STATUSES, STATUS_BY_VALUE } from '../lib/status';
import './StatusPill.css';

// Icons stay coupled to the component (component file)
const ICONS = {
  not_started: Circle,
  attempted: Edit3,
  solved: CheckCircle2,
  mastered: Award,
  bookmarked: Star,
  needs_revision: RotateCcw,
};

export default function StatusPill({ value, onChange, size = 'md', disabled = false }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const current = STATUS_BY_VALUE[value] || STATUSES[0];
  const Icon = ICONS[current.value] || Circle;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div
      className={`status-pill-wrap status-pill-${size} status-pill-color-${current.color}`}
      ref={wrapRef}
    >
      <button
        type="button"
        className="status-pill-btn"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-label={`Status: ${current.label}`}
      >
        <Icon size={size === 'sm' ? 12 : 14} className="status-pill-icon" />
        <span className="status-pill-label">{current.label}</span>
        {!disabled && <ChevronDown size={11} className={`status-pill-chevron ${open ? 'open' : ''}`} />}
      </button>
      {open && (
        <div className="status-pill-menu" role="menu">
          {STATUSES.map(s => {
            const SIcon = ICONS[s.value] || Circle;
            return (
              <button
                key={s.value}
                role="menuitem"
                type="button"
                className={`status-pill-menu-item status-pill-color-${s.color} ${s.value === value ? 'active' : ''}`}
                onClick={() => {
                  if (onChange) onChange(s.value);
                  setOpen(false);
                }}
              >
                <SIcon size={12} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
