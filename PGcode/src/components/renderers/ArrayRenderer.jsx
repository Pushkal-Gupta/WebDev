import React from 'react';
import './Renderers.css';

const POINTER_COLORS = ['var(--accent)', 'var(--medium)', 'var(--easy)', 'var(--hard)', 'var(--blue)', 'var(--violet)'];

// Seeded dry-run rows often store cells as `{ state, value }` rather than raw
// primitives (see interactive_dry_runs.visual_state_data). Pluck the display
// string so React doesn't try to render the object directly — which throws
// "Objects are not valid as a React child" and crashes the whole route.
function cellText(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    if (v.value != null) return cellText(v.value);
    if (v.label != null) return cellText(v.label);
    if (v.name != null) return cellText(v.name);
    return JSON.stringify(v);
  }
  return String(v);
}
function cellState(v) {
  return (v && typeof v === 'object' && typeof v.state === 'string') ? v.state : null;
}

export default function ArrayRenderer({ data }) {
  const { array = [], highlights = [], pointers = {}, hashset, hashmap, labels = {} } = data;
  const highlightColor = data.highlightColor || 'accent';
  const pointerEntries = Object.entries(pointers);

  const getHighlightStyle = (idx) => {
    if (!highlights.includes(idx)) return {};
    const colorMap = {
      accent: { borderColor: 'var(--accent)', background: 'rgba(0, 255, 245, 0.1)', boxShadow: '0 0 12px rgba(0, 255, 245, 0.2)' },
      green: { borderColor: 'var(--easy)', background: 'rgba(34, 197, 94, 0.1)', boxShadow: '0 0 12px rgba(34, 197, 94, 0.2)' },
      red: { borderColor: 'var(--hard)', background: 'rgba(239, 68, 68, 0.1)', boxShadow: '0 0 12px rgba(239, 68, 68, 0.2)' },
      yellow: { borderColor: 'var(--medium)', background: 'rgba(240, 165, 0, 0.1)', boxShadow: '0 0 12px rgba(240, 165, 0, 0.2)' },
    };
    return colorMap[highlightColor] || colorMap.accent;
  };

  return (
    <div className="arr-renderer">
      {/* Array cells */}
      <div className="arr-cells">
        {array.map((val, idx) => {
          const display = cellText(val);
          const state = cellState(val);
          return (
          <div key={idx} className="arr-cell-wrap">
            {labels[String(idx)] && (
              <span className="arr-label">{cellText(labels[String(idx)])}</span>
            )}
            <div
              className={`arr-cell ${highlights.includes(idx) ? 'arr-cell-hl' : ''} ${state ? `arr-cell-${state}` : ''}`}
              style={getHighlightStyle(idx)}
            >
              <span className="arr-val">{display}</span>
            </div>
            <span className="arr-idx">{idx}</span>

            {/* Pointers below this cell */}
            <div className="arr-pointers">
              {pointerEntries.map(([name, pIdx], ci) => {
                if (pIdx !== idx) return null;
                return (
                  <div key={name} className="arr-pointer" style={{ color: POINTER_COLORS[ci % POINTER_COLORS.length] }}>
                    <span className="arr-ptr-arrow">&#8593;</span>
                    <span className="arr-ptr-name">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>

      {/* Companion: Hash Set */}
      {hashset !== undefined && (
        <div className="arr-companion">
          <span className="arr-comp-label">Hash Set</span>
          <div className="arr-comp-items">
            {hashset.length === 0 ? (
              <span className="arr-comp-empty">empty</span>
            ) : (
              hashset.map((v, i) => (
                <span key={i} className="arr-comp-pill">{cellText(v)}</span>
              ))
            )}
          </div>
        </div>
      )}

      {/* Companion: Hash Map */}
      {hashmap && (
        <div className="arr-companion">
          <span className="arr-comp-label">Hash Map</span>
          <div className="arr-comp-map">
            {Object.entries(hashmap).map(([k, v], i) => (
              <div key={i} className="arr-comp-entry">
                <span className="arr-comp-key">{cellText(k)}</span>
                <span className="arr-comp-sep">&rarr;</span>
                <span className="arr-comp-val">{cellText(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
