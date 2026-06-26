import React from 'react';
import { Link } from 'react-router-dom';
import { ListPlus, Notebook, RotateCcw, TrendingUp, History, Award, ClipboardList, ArrowRight, Brain, Lock } from 'lucide-react';
import VaultMotif from './VaultMotifs';
import './PGVaultHub.css';

const CARDS = [
  {
    to: '/assessments',
    Icon: ClipboardList,
    title: 'Assessments',
    desc: 'Timed, generated practice sets that mock a real interview round.',
    hue: 'var(--hue-mint)',
    motif: 'assessments',
    requiresAuth: true,
  },
  {
    to: '/review',
    Icon: RotateCcw,
    title: 'Review',
    desc: 'Your spaced-repetition queue — problems due for another pass.',
    hue: 'var(--hue-sky)',
    motif: 'review',
    requiresAuth: true,
  },
  {
    to: '/lists',
    Icon: ListPlus,
    title: 'Lists',
    desc: 'Saved problem lists — curate, rename, and share sets.',
    hue: 'var(--hue-mint)',
    motif: 'lists',
    requiresAuth: true,
  },
  {
    to: '/notebook',
    Icon: Notebook,
    title: 'Notes',
    desc: 'Every note you have written on a problem, searchable in one feed.',
    hue: 'var(--hue-violet)',
    motif: 'notes',
    requiresAuth: true,
  },
  {
    to: '/progress',
    Icon: TrendingUp,
    title: 'Progress',
    desc: 'Stats, streaks, and topic mastery at a glance.',
    hue: 'var(--accent)',
    motif: 'progress',
    requiresAuth: true,
  },
  {
    to: '/ml/progress?from=vault',
    Icon: Brain,
    title: 'ML Progress',
    desc: 'PGForge ML problems — solved ring, badges, streak, and recent activity.',
    hue: 'var(--hue-pink)',
    motif: 'ml',
    requiresAuth: true,
  },
  {
    to: '/history',
    Icon: History,
    title: 'History',
    desc: 'Every submission you have made — by verdict, language, and date.',
    hue: 'var(--hue-sky)',
    motif: 'history',
    requiresAuth: true,
  },
  {
    to: '/achievements',
    Icon: Award,
    title: 'Achievements',
    desc: 'Badges and milestones you unlock as you solve and keep streaks.',
    hue: 'var(--warning)',
    motif: 'achievements',
    requiresAuth: true,
  },
];

export default function PGVaultHub({ session }) {
  const loggedIn = Boolean(session?.user);
  const cards = loggedIn
    ? CARDS
    : [...CARDS].sort((a, b) => Number(a.requiresAuth) - Number(b.requiresAuth));

  return (
    <div className="pgv-page">
      <header className="pgv-header">
        <h1 className="pgv-title">
          <span className="pgv-pg">PG</span>Vault
        </h1>
        <p className="pgv-sub">
          Lists, notes, review queue, history, achievements, and progress.
        </p>
      </header>

      <div className="pgv-grid">
        {cards.map((card) => {
          const CardIcon = card.Icon;
          const gated = !loggedIn && card.requiresAuth;
          return (
            <Link
              key={card.to}
              to={card.to}
              className={`pgv-card${gated ? ' pgv-card-gated' : ''}`}
              style={{ '--pgv-hue': card.hue }}
            >
              <div className="pgv-card-thumb">
                <VaultMotif kind={card.motif} hue={card.hue} />
                <span className="pgv-card-icon">
                  <CardIcon size={20} strokeWidth={1.8} />
                </span>
                {gated && (
                  <span className="pgv-card-lock" aria-label="Sign in to use">
                    <Lock size={13} strokeWidth={2} />
                  </span>
                )}
              </div>
              <div className="pgv-card-body">
                <h2 className="pgv-card-title">{card.title}</h2>
                <p className="pgv-card-desc">{card.desc}</p>
                <span className="pgv-card-go">
                  {gated ? (
                    <>Sign in to use <Lock size={14} strokeWidth={2} /></>
                  ) : (
                    <>Open <ArrowRight size={15} strokeWidth={2} /></>
                  )}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
