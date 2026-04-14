import React from 'react';
import './Renderers.css';

const POINTER_COLORS = ['var(--accent)', 'var(--medium)', 'var(--easy)', 'var(--hard)'];

const stateStyles = {
  default: {},
  current: { borderColor: 'var(--accent)', background: 'rgba(0, 255, 245, 0.1)', boxShadow: '0 0 12px rgba(0, 255, 245, 0.2)' },
  visited: { borderColor: 'var(--easy)', background: 'rgba(34, 197, 94, 0.08)' },
  highlighted: { borderColor: 'var(--medium)', background: 'rgba(240, 165, 0, 0.08)' },
};

export default function LinkedListRenderer({ data }) {
  const { nodes = [], pointers = {} } = data;
  const pointerEntries = Object.entries(pointers);

  return (
    <div className="ll-renderer">
      <div className="ll-chain">
        {nodes.map((node, idx) => (
          <React.Fragment key={idx}>
            <div className="ll-node-wrap">
              <div
                className="ll-node"
                style={stateStyles[node.state] || stateStyles.default}
              >
                <span className="ll-val">{node.value}</span>
              </div>

              {/* Pointers */}
              <div className="ll-pointers">
                {pointerEntries.map(([name, pIdx], ci) => {
                  if (pIdx !== idx) return null;
                  return (
                    <div key={name} className="ll-pointer" style={{ color: POINTER_COLORS[ci % POINTER_COLORS.length] }}>
                      <span className="ll-ptr-arrow">&#8593;</span>
                      <span className="ll-ptr-name">{name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Arrow between nodes */}
            {idx < nodes.length - 1 && (
              <div className="ll-arrow">&rarr;</div>
            )}
          </React.Fragment>
        ))}

        {/* Null terminator */}
        <div className="ll-arrow">&rarr;</div>
        <div className="ll-null">null</div>
      </div>
    </div>
  );
}
