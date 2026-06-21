import React from 'react';
import './Renderers.css';

const stateStyles = {
  default: {},
  new: { background: 'rgba(var(--accent-rgb), 0.08)', borderLeft: '3px solid var(--accent)' },
  modified: { background: 'rgba(var(--medium-rgb), 0.08)', borderLeft: '3px solid var(--medium)' },
  deleted: { background: 'rgba(var(--hard-rgb), 0.06)', borderLeft: '3px solid var(--hard)', opacity: 0.5 },
};

function cellText(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') return String(v.value ?? v.label ?? v.name ?? '');
  return String(v);
}

export default function HashMapRenderer({ data }) {
  const { entries = [] } = data;

  return (
    <div className="hm-renderer">
      <div className="hm-table">
        <div className="hm-header">
          <span className="hm-col-key">Key</span>
          <span className="hm-col-val">Value</span>
        </div>
        <div className="hm-body">
          {entries.map((entry, idx) => (
            <div
              key={idx}
              className="hm-row"
              style={stateStyles[entry.state] || stateStyles.default}
            >
              <span className="hm-key">{cellText(entry.key)}</span>
              <span className="hm-val">{cellText(entry.value)}</span>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="hm-empty">empty</div>
          )}
        </div>
      </div>
    </div>
  );
}
