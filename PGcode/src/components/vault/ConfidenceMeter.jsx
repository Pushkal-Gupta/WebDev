import React from 'react';

export default function ConfidenceMeter({ value = 0, max = 5, color = 'var(--accent)', label }) {
  const v = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <span className="vault-meter" title={`Confidence ${v}/${max}`}>
      {label && <span className="vault-meter-label">{label}</span>}
      <span className="vault-meter-track" aria-label={`Confidence ${v} of ${max}`}>
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className="vault-meter-seg"
            style={{ background: i < v ? color : 'var(--border)' }}
          />
        ))}
      </span>
    </span>
  );
}
