import React, { useMemo } from 'react';

const DAY_LABEL = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GitHub-style contribution grid. `counts` is a Map keyed by a day's
// midnight-millis timestamp → number of solves that day. The grid is laid out
// column-by-column (one column per week) for the trailing `weeks` weeks, ending
// on the current week. Intensity ramps across four token-driven steps.
//
// Cells are a fixed pixel size (`cellSize`) so the grid stays tight and even no
// matter how wide its card is — it never stretches into giant squares. The grid
// is horizontally centered in its track; with the default ~17 weeks it fills a
// typical card without a scrollbar.
export default function ActivityHeatmap({ counts, weeks = 17, cellSize = 13, gap = 4 }) {
  const { columns, max, total, active } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Anchor on the Sunday that ends the current week so the last column is "this week".
    const endSunday = new Date(today);
    endSunday.setDate(today.getDate() + (6 - today.getDay()));

    const cols = [];
    let mx = 0;
    let tot = 0;
    let act = 0;
    for (let w = weeks - 1; w >= 0; w--) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const cell = new Date(endSunday);
        cell.setDate(endSunday.getDate() - (w * 7) + (d - 6));
        cell.setHours(0, 0, 0, 0);
        const future = cell.getTime() > today.getTime();
        const n = future ? 0 : (counts.get(cell.getTime()) || 0);
        if (!future) { tot += n; if (n > 0) act += 1; }
        if (n > mx) mx = n;
        col.push({ date: cell, n, future });
      }
      cols.push(col);
    }
    return { columns: cols, max: mx, total: tot, active: act };
  }, [counts, weeks]);

  const level = (n) => {
    if (n <= 0) return 0;
    if (max <= 1) return 4;
    const r = n / max;
    if (r <= 0.25) return 1;
    if (r <= 0.5) return 2;
    if (r <= 0.75) return 3;
    return 4;
  };

  // Month labels: tag a column when its first day starts a new month vs the prior column.
  const monthMarks = columns.map((col, i) => {
    const m = col[0].date.getMonth();
    const prev = i > 0 ? columns[i - 1][0].date.getMonth() : -1;
    return m !== prev ? MONTH_ABBR[m] : '';
  });

  const cellStep = `${cellSize}px`;
  const gapStep = `${gap}px`;
  const railH = cellSize + 2;

  return (
    <div className="hm" style={{ '--hm-cell': cellStep, '--hm-gap': gapStep }}>
      <div className="hm-head">
        <span className="hm-title">Last {weeks} weeks</span>
        <span className="hm-sub">{total} solve{total === 1 ? '' : 's'} · {active} active day{active === 1 ? '' : 's'}</span>
      </div>
      <div className="hm-scroll">
        <div className="hm-body">
          <div className="hm-days" aria-hidden="true" style={{ marginTop: `${railH}px` }}>
            {DAY_LABEL.map((d, i) => <span key={i} className="hm-day">{d}</span>)}
          </div>
          <div className="hm-grid-wrap">
            <div className="hm-months" aria-hidden="true">
              {monthMarks.map((m, i) => <span key={i} className="hm-month">{m}</span>)}
            </div>
            <div className="hm-grid" role="img" aria-label={`${total} solves over the last ${weeks} weeks`}>
              {columns.map((col, ci) => (
                <div key={ci} className="hm-col">
                  {col.map((cell, ri) => (
                    <div
                      key={ri}
                      className={`hm-cell hm-l${cell.future ? 0 : level(cell.n)} ${cell.future ? 'hm-future' : ''}`}
                      title={cell.future ? '' : `${cell.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — ${cell.n} solve${cell.n === 1 ? '' : 's'}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="hm-legend">
        <span className="hm-legend-label">Less</span>
        <span className="hm-cell hm-l0" />
        <span className="hm-cell hm-l1" />
        <span className="hm-cell hm-l2" />
        <span className="hm-cell hm-l3" />
        <span className="hm-cell hm-l4" />
        <span className="hm-legend-label">More</span>
      </div>
    </div>
  );
}
