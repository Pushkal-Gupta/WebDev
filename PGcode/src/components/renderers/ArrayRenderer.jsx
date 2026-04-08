import React from 'react';
import './renderers.css';

const POINTER_COLORS = ['var(--accent)', 'var(--medium)', 'var(--easy)', 'var(--hard)', 'var(--blue)', 'var(--violet)'];

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
        {array.map((val, idx) => (
          <div key={idx} className="arr-cell-wrap">
            {labels[String(idx)] && (
              <span className="arr-label">{labels[String(idx)]}</span>
            )}
            <div
              className={`arr-cell ${highlights.includes(idx) ? 'arr-cell-hl' : ''}`}
              style={getHighlightStyle(idx)}
            >
              <span className="arr-val">{val}</span>
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
        ))}
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
                <span key={i} className="arr-comp-pill">{v}</span>
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
                <span className="arr-comp-key">{k}</span>
                <span className="arr-comp-sep">&rarr;</span>
                <span className="arr-comp-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
