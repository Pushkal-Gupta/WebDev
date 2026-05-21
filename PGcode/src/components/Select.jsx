import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './Select.css';

// Drop-in replacement for a <select>. Renders a popover panel anchored to the
// trigger, keyboard-accessible, themed via CSS vars.
//
// Props:
//   - value: current value (string)
//   - onChange(next: string)
//   - options: Array<{ value, label, hint?, disabled? }>
//   - className?: extra class on trigger
//   - placeholder?: shown when no value matches
//   - size?: 'sm' | 'md'  (default 'md')
//   - icon?: ReactNode rendered before the label
export default function Select({
  value, onChange, options, className = '',
  placeholder = 'Select…', size = 'md', icon,
}) {
  const [open, setOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const current = options.find(o => o.value === value);

  const close = useCallback(() => { setOpen(false); setHoverIdx(-1); }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!panelRef.current || !triggerRef.current) return;
      if (panelRef.current.contains(e.target) || triggerRef.current.contains(e.target)) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); triggerRef.current?.focus(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHoverIdx(i => Math.min(options.length - 1, i + 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHoverIdx(i => Math.max(0, i - 1));
        return;
      }
      if (e.key === 'Enter' && hoverIdx >= 0) {
        e.preventDefault();
        const o = options[hoverIdx];
        if (o && !o.disabled) { onChange(o.value); close(); }
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, options, hoverIdx, onChange, close]);

  return (
    <div className={`pg-select pg-select-${size} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="pg-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {icon && <span className="pg-select-icon">{icon}</span>}
        <span className="pg-select-label">{current?.label || placeholder}</span>
        <ChevronDown size={12} className={`pg-select-chevron ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div ref={panelRef} className="pg-select-panel" role="listbox">
          {options.map((o, i) => {
            const active = o.value === value;
            const hovered = i === hoverIdx;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                disabled={o.disabled}
                className={`pg-select-option ${active ? 'active' : ''} ${hovered ? 'hover' : ''}`}
                onMouseEnter={() => setHoverIdx(i)}
                onClick={() => {
                  if (o.disabled) return;
                  onChange(o.value);
                  close();
                }}
              >
                <span className="pg-select-option-label">{o.label}</span>
                {o.hint && <span className="pg-select-option-hint">{o.hint}</span>}
                {active && <Check size={12} className="pg-select-option-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
