import React from 'react';
import './Renderers.css';

const stateStyles = {
  default: {},
  new: { background: 'rgba(0, 255, 245, 0.08)', borderLeft: '3px solid var(--accent)' },
  modified: { background: 'rgba(240, 165, 0, 0.08)', borderLeft: '3px solid var(--medium)' },
  deleted: { background: 'rgba(239, 68, 68, 0.06)', borderLeft: '3px solid var(--hard)', opacity: 0.5 },
};

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
              <span className="hm-key">{entry.key}</span>
              <span className="hm-val">{entry.value}</span>
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
