import { useState, lazy, Suspense } from 'react';
import styles from './Training.module.css';

const LessonsPage    = lazy(() => import('../Lessons/LessonsPage'));
const CoachPanel     = lazy(() => import('../Coach/CoachPanel'));
const OpeningTrainer = lazy(() => import('../OpeningTrainer/OpeningTrainer'));
const EndgameTrainer = lazy(() => import('../EndgameTrainer/EndgameTrainer'));
const BasicsTraining = lazy(() => import('./CoordinateTrainer'));

const TABS = [
  { key: 'lessons',  label: 'Lessons' },
  { key: 'coach',    label: 'Coach' },
  { key: 'openings', label: 'Openings' },
  { key: 'endgames', label: 'Endgames' },
  { key: 'basics',   label: 'Basics' },
];

export default function TrainingHub() {
  const [tab, setTab] = useState('lessons');

  return (
    <div className={styles.hubPage}>
      <div className={styles.hubBar}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.hubBtn} ${tab === t.key ? styles.hubBtnActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.hubContent}>
        <Suspense fallback={<div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 40 }}>Loading...</div>}>
          {tab === 'lessons'  && <LessonsPage />}
          {tab === 'coach'    && <CoachPanel />}
          {tab === 'openings' && <OpeningTrainer />}
          {tab === 'endgames' && <EndgameTrainer />}
          {tab === 'basics'   && <BasicsTraining />}
        </Suspense>
      </div>
    </div>
  );
}
