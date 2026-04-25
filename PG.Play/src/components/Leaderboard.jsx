// Leaderboard — public top-N rows for a single game.
//
// Reads from the deployed `leaderboard` Supabase edge function (15s edge
// cache, no auth required). Top three ranks get gold/silver/bronze pills;
// the rest get muted mono digits. Empty state is a real moment (icon +
// invitation copy) rather than a sentence. Loading shows shimmer rows.
//
// Motion: staggered row entrance (0.03s each). AnimatePresence is keyed
// by display_name so subsequent re-renders don't replay the animation
// for already-mounted rows.

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon } from '../icons.jsx';
import { useLeaderboard } from '../hooks/useLeaderboard.js';

const MEDALS = ['lb-rank-gold', 'lb-rank-silver', 'lb-rank-bronze'];

function SkeletonRow({ i }) {
  return (
    <li className="lb-row lb-row-skel" aria-hidden="true">
      <span className="lb-skel-rank"/>
      <span className="lb-skel-dot"/>
      <span className="lb-skel-name" style={{ width: `${48 + ((i * 7) % 30)}%` }}/>
      <span className="lb-skel-score"/>
    </li>
  );
}

export default function Leaderboard({ gameId, limit = 10 }) {
  const { rows, loading } = useLeaderboard(gameId, limit);
  const reduced = useReducedMotion();

  if (loading) {
    return (
      <div className="lb glass">
        <div className="lb-head">Top {limit} · global</div>
        <ol className="lb-list" aria-busy="true" aria-live="polite">
          {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} i={i}/>)}
        </ol>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="lb glass">
        <div className="lb-head">Top {limit} · global</div>
        <div className="lb-empty-rich">
          <span className="lb-empty-ico">{Icon.trophy}</span>
          <div className="lb-empty-copy">
            <div className="lb-empty-title">Open lobby</div>
            <div className="lb-empty-sub">
              This board is yours for the taking. Sign in to keep your runs.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const itemBase = reduced
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit:    { opacity: 0 },
      };

  return (
    <div className="lb glass">
      <div className="lb-head">Top {limit} · global</div>
      <ol className="lb-list">
        <AnimatePresence initial={true}>
          {rows.map((row, i) => {
            const medal = i < 3 ? MEDALS[i] : '';
            return (
              <motion.li
                key={row.display_name || `row-${i}`}
                className={`lb-row${i < 3 ? ' lb-row-medal' : ''}`}
                {...itemBase}
                transition={{
                  duration: reduced ? 0 : 0.22,
                  delay: reduced ? 0 : i * 0.03,
                  ease: [0.16, 1, 0.3, 1],
                }}>
                <span className={`lb-rank ${medal}`}>{i + 1}</span>
                <span
                  className="lb-dot"
                  style={{ background: row.color || 'var(--accent)' }}
                  aria-hidden="true"
                />
                <span className="lb-name">{row.display_name}</span>
                <span className="lb-score">{row.best.toLocaleString()}</span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
}
