import React from 'react';
import './Learn.css';

// Compare common growth rates for n = 32 (small enough for a quick mental anchor).
// Heights are normalized to the largest curve so the user sees relative ratios.
const N = 32;
const CURVES = [
  { id: 'O(1)',        f: () => 1,                 hint: 'flat' },
  { id: 'O(log n)',    f: (n) => Math.log2(n),     hint: 'doubling input adds one' },
  { id: 'O(n)',        f: (n) => n,                hint: 'linear in input' },
  { id: 'O(n log n)',  f: (n) => n * Math.log2(n), hint: 'sort baseline' },
  { id: 'O(n²)',       f: (n) => n * n,            hint: 'nested loops' },
  { id: 'O(2ⁿ)',       f: (n) => Math.pow(2, n / 4), hint: 'recursive explosion (clipped)' },
];

function normalizeComplexity(input) {
  if (!input) return null;
  const s = input.toLowerCase().replace(/[\s·]/g, '');
  if (s.includes('o(1)')) return 'O(1)';
  if (s.includes('o(logn)') || s.includes('o(log_2n)') || s.includes('o(logk)') || s.includes('o(logm)')) return 'O(log n)';
  if (s.includes('o(nlogn)') || s.includes('o(n·logn)') || s.includes('o(klogk)') || s.includes('o(mlogm)')) return 'O(n log n)';
  if (s.includes('o(n^2)') || s.includes('o(n²)') || s.includes('o(n*n)') || s.includes('o(k^2)') || s.includes('o(k²)') || s.includes('o(m^2)')) return 'O(n²)';
  if (s.includes('o(2^n)') || s.includes('o(2ⁿ)') || s.includes('o(2^k)')) return 'O(2ⁿ)';
  // Linear-in-some-parameter: k, m, V+E, V*E, M+N, etc.
  if (s.includes('o(n)') || s.includes('o(k)') || s.includes('o(m)') || s.includes('o(v+e)') || s.includes('o(v·e)') || s.includes('o(m+n)') || s.includes('o(n+m)') || s.includes('o(n+k)')) return 'O(n)';
  return null;
}

export default function ComplexityChart({ time }) {
  const highlight = normalizeComplexity(time);
  const values = CURVES.map(c => ({ id: c.id, hint: c.hint, v: c.f(N) }));
  const max = Math.max(...values.map(v => v.v));

  return (
    <div className="ccx" role="img" aria-label="Growth-rate comparison chart">
      <div className="ccx-bars">
        {values.map(({ id, hint, v }) => {
          const pct = Math.max(2, Math.round((v / max) * 100));
          const isMatch = highlight === id;
          return (
            <div key={id} className={`ccx-col ${isMatch ? 'ccx-col-match' : ''}`} title={`${id} — ${hint}`}>
              <div className="ccx-bar-wrap">
                <div className="ccx-bar" style={{ height: `${pct}%` }} />
              </div>
              <span className="ccx-label">{id}</span>
              {isMatch && <span className="ccx-tag">this concept</span>}
            </div>
          );
        })}
      </div>
      <p className="ccx-caption">
        Relative cost at n = {N}.
        {highlight ? <> The <code>{highlight}</code> bar matches this concept&rsquo;s growth shape (the variable name may differ — k, m, V+E, etc. — but the curve is the same).</> : null}
        {' '}Each bar is normalized to the tallest visible curve so you can eyeball the shape, not the absolute numbers.
      </p>
    </div>
  );
}
