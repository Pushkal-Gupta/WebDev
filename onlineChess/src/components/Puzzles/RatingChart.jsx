import { useState, useRef, useEffect } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import styles from './PuzzlePage.module.css';

export default function RatingChart({ ratingHistory, loading }) {
  const [expanded, setExpanded] = useState(false);
  const chartRef = useRef(null);
  const plotRef = useRef(null);

  useEffect(() => {
    if (!expanded || !chartRef.current || !ratingHistory || ratingHistory.length < 2) {
      if (plotRef.current) {
        plotRef.current.destroy();
        plotRef.current = null;
      }
      return;
    }

    // Prepare data: [timestamps[], ratings[]]
    const timestamps = ratingHistory.map(r => Math.floor(new Date(r.recorded_at).getTime() / 1000));
    const ratings = ratingHistory.map(r => r.rating);

    const opts = {
      width: chartRef.current.clientWidth,
      height: 140,
      cursor: { show: true },
      select: { show: false },
      legend: { show: false },
      axes: [
        {
          stroke: 'rgba(255,255,255,0.3)',
          grid: { stroke: 'rgba(255,255,255,0.05)' },
          ticks: { stroke: 'rgba(255,255,255,0.1)' },
          font: '10px system-ui',
          values: (u, vals) => vals.map(v => {
            const d = new Date(v * 1000);
            return `${d.getMonth()+1}/${d.getDate()}`;
          }),
        },
        {
          stroke: 'rgba(255,255,255,0.3)',
          grid: { stroke: 'rgba(255,255,255,0.05)' },
          ticks: { stroke: 'rgba(255,255,255,0.1)' },
          font: '10px system-ui',
          size: 40,
        },
      ],
      series: [
        {},
        {
          stroke: '#00fff5',
          width: 2,
          fill: 'rgba(0,255,245,0.05)',
          points: { show: ratingHistory.length < 50, size: 4, fill: '#00fff5' },
        },
      ],
    };

    // Clear previous
    if (plotRef.current) {
      plotRef.current.destroy();
    }
    chartRef.current.innerHTML = '';

    plotRef.current = new uPlot(opts, [timestamps, ratings], chartRef.current);

    return () => {
      if (plotRef.current) {
        plotRef.current.destroy();
        plotRef.current = null;
      }
    };
  }, [expanded, ratingHistory]);

  return (
    <div className={styles.historySection}>
      <div className={styles.historySectionHeader} onClick={() => setExpanded(!expanded)}>
        <span>Rating History</span>
        <span className={styles.expandArrow}>{expanded ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expanded && (
        <div className={styles.chartContainer}>
          {loading ? (
            <div className={styles.loadingText}>Loading chart...</div>
          ) : !ratingHistory || ratingHistory.length < 2 ? (
            <div className={styles.emptyMsg}>Solve more puzzles to see your rating chart</div>
          ) : (
            <div ref={chartRef} />
          )}
        </div>
      )}
    </div>
  );
}
