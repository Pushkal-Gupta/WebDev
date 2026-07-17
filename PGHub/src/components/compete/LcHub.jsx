import { Link } from 'react-router-dom';
import { ListOrdered, Trophy, ArrowRight } from 'lucide-react';
import Breadcrumb from '../common/Breadcrumb';
import LeetCodeAnalytics from '../contests/LeetCodeAnalytics';
import './LcHub.css';

const HUES = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];

const NAV_CARDS = [
  {
    to: '/compete/leetcode/problems',
    icon: ListOrdered,
    title: 'Problems',
    sub: 'Browse the full LeetCode catalog with difficulty, tags and acceptance rates.',
  },
  {
    to: '/compete/leetcode/contests',
    icon: Trophy,
    title: 'Contests',
    sub: 'Weekly and biweekly rounds, rankings and per-question breakdowns.',
  },
];

// The Rating Predictor IS the home: the full single/compare + contest-results +
// what-if experience renders inline (embedded), defaulted to the latest contest —
// no need to open a contest and click "Analysis" to reach it.
export default function LcHub() {
  return (
    <div className="lch-wrap">
      <Breadcrumb items={[{ label: 'Compete', to: '/compete' }, { label: 'LeetCode' }]} />

      <header className="lch-hero">
        <h1 className="lch-title">LeetCode</h1>
        <p className="lch-sub">
          Work the catalog, follow the contests, and check how your latest round moved your rating.
        </p>
      </header>

      <div className="lch-nav-row">
        {NAV_CARDS.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.to}
              to={c.to}
              className="lch-feature"
              style={{ '--feat-hue': HUES[i % HUES.length] }}
            >
              <span className="lch-feature-icon">
                <Icon size={20} aria-hidden />
              </span>
              <span className="lch-feature-text">
                <span className="lch-feature-title">{c.title}</span>
                <span className="lch-feature-sub">{c.sub}</span>
              </span>
              <ArrowRight size={18} className="lch-feature-arrow" aria-hidden />
            </Link>
          );
        })}
      </div>

      <LeetCodeAnalytics embedded />
    </div>
  );
}
