import { useState, useEffect, lazy, Suspense } from 'react';
import styles from './Training.module.css';
import CoachBubble from '../Coach/CoachBubble';
import useGameStore from '../../store/gameStore';

const LessonsPage    = lazy(() => import('../Lessons/LessonsPage'));
const OpeningTrainer = lazy(() => import('../OpeningTrainer/OpeningTrainer'));
const EndgameTrainer = lazy(() => import('../EndgameTrainer/EndgameTrainer'));
const BasicsTraining = lazy(() => import('./CoordinateTrainer'));

// ── Hub modules ─────────────────────────────────────────────────────────────
// Each entry is a card on the training landing page. `route` is the internal
// view key. `status` 'live' opens the trainer; 'soon' shows a coming-soon tile.
const MODULES = [
  {
    route: 'lessons',
    title: 'Lessons',
    blurb: 'Step-by-step interactive lessons covering tactics, openings, endgames, and strategy.',
    cta: 'Start learning',
    status: 'live',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5a2 2 0 0 1 2-2h6v18H5a2 2 0 0 1-2-2V5z"/>
        <path d="M21 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2V5z"/>
      </svg>
    ),
    accent: '#6fdc8c',
  },
  {
    route: 'openings',
    title: 'Openings',
    blurb: 'Train your repertoire with explorer-backed lines, key ideas, and common traps.',
    cta: 'Train openings',
    status: 'live',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4l9 8 9-8M3 12l9 8 9-8"/>
      </svg>
    ),
    accent: '#5dade2',
  },
  {
    route: 'endgames',
    title: 'Endgames',
    blurb: 'Drill essential endgame patterns: K+P, K+R, opposition, Lucena, Philidor.',
    cta: 'Train endgames',
    status: 'live',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2"/>
        <path d="M4 12h16M12 4v16"/>
        <circle cx="8" cy="8" r="1.6" fill="currentColor"/>
        <circle cx="16" cy="16" r="1.6"/>
      </svg>
    ),
    accent: '#f0c94c',
  },
  {
    route: 'basics',
    title: 'Vision',
    blurb: 'Sharpen your board fluency: identify squares quickly, train coordinates and notation.',
    cta: 'Train vision',
    status: 'live',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    accent: '#e74c3c',
  },
];

function ModuleCard({ mod, onClick }) {
  const isLive = mod.status === 'live';
  return (
    <button
      className={`${styles.modCard} ${isLive ? '' : styles.modCardSoon}`}
      style={{ '--mod-accent': mod.accent }}
      onClick={isLive ? onClick : undefined}
      disabled={!isLive}
      type="button"
    >
      <span className={styles.modIcon} aria-hidden="true">{mod.icon}</span>
      <span className={styles.modTitle}>{mod.title}</span>
      <span className={styles.modBlurb}>{mod.blurb}</span>
      <span className={styles.modCta}>{mod.cta}</span>
      {!isLive && <span className={styles.modBadge}>Soon</span>}
    </button>
  );
}

export default function TrainingHub() {
  const [view, setView] = useState('hub');

  // Ensure the global chess instance exists so the floating Coach bubble can
  // analyze the starting position (otherwise its prompt buttons are disabled
  // because fen is null). Trainers themselves use their own local chess.js
  // instances, so this doesn't disturb them.
  useEffect(() => {
    const { chessInstance, init } = useGameStore.getState();
    if (!chessInstance) init();
  }, []);

  const renderTrainer = () => {
    switch (view) {
      case 'lessons':  return <LessonsPage />;
      case 'openings': return <OpeningTrainer />;
      case 'endgames': return <EndgameTrainer />;
      case 'basics':   return <BasicsTraining />;
      default:         return null;
    }
  };

  if (view !== 'hub') {
    return (
      <div className={styles.hubPage}>
        <div className={styles.subBar}>
          <button className={styles.backBtn} onClick={() => setView('hub')}>
            ← Training
          </button>
          <span className={styles.subTitle}>
            {MODULES.find((m) => m.route === view)?.title || ''}
          </span>
        </div>
        <div className={styles.hubContent}>
          <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
            {renderTrainer()}
          </Suspense>
        </div>
        <CoachBubble context="training" />
      </div>
    );
  }

  return (
    <div className={styles.hubPage}>
      <div className={styles.hubHeader}>
        <h1 className={styles.hubTitle}>Training</h1>
        <p className={styles.hubSubtitle}>
          Pick a track to keep improving — lessons, drills, openings, endgames, and board vision all in one place.
        </p>
      </div>

      <div className={styles.hubGrid}>
        {MODULES.map((mod) => (
          <ModuleCard key={mod.route} mod={mod} onClick={() => setView(mod.route)} />
        ))}
      </div>

      <CoachBubble context="training" />
    </div>
  );
}
