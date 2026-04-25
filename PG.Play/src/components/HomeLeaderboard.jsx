// HomeLeaderboard — "Top of the boards" panel for the homepage.
//
// One row per playable, leaderboard-tracked game. Each row shows the
// game's name (bold), the current top scorer's display name, and their
// best score. Click any row to jump into that game's intro. Hooks
// directly into `useLeaderboard` per game (limit=1) — same source the
// per-game intro uses, served from the cached edge function.

import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { GAMES, EDITORS_PICKS } from '../data.js';
import { Icon } from '../icons.jsx';
import { useLeaderboard } from '../hooks/useLeaderboard.js';

// Show boards for the four headline originals + the two quiet classics.
// Adding all 18 playable rows would dominate the page; this is the
// editorial cut. The full per-game leaderboard still lives on each
// game's intro page.
const BOARD_GAMES = [...EDITORS_PICKS, 'g2048', 'connect4'];

const CAT_TO_GENRE = {
  Rage:        'action',
  FPS:         'action',
  Shooter:     'action',
  Action:      'action',
  Platformer:  'action',
  Stealth:     'action',
  Sports:      'sports',
  Arcade:      'arcade',
  'Co-op':     'arcade',
  Multiplayer: 'arcade',
  Physics:     'arcade',
  'Time-mgmt': 'arcade',
  Puzzle:      'puzzle',
  Classic:     'puzzle',
  'Tower-Def': 'puzzle',
  Strategy:    'puzzle',
};

function genreVar(cat) {
  return `var(--genre-${CAT_TO_GENRE[cat] || 'arcade'})`;
}

function HomeBoardRow({ game, index, reduced }) {
  const navigate = useNavigate();
  const { rows, loading } = useLeaderboard(game.id, 1);
  const top = rows[0];
  const accent = genreVar(game.cat);

  const onOpen = () => navigate(`/game/${game.id}`);
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <motion.li
      className="hlb-row"
      style={{ '--accent-row': accent }}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKey}
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0 : 0.24,
        delay:    reduced ? 0 : index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={reduced ? {} : { x: 2 }}>
      <span className="hlb-bullet" aria-hidden="true"/>
      <span className="hlb-name">{game.name}</span>
      <span className="hlb-scorer">
        {loading ? <span className="hlb-skel hlb-skel-name"/> : (top?.display_name || '—')}
      </span>
      <span className="hlb-score">
        {loading ? <span className="hlb-skel hlb-skel-score"/> : (top ? top.best.toLocaleString() : '—')}
      </span>
      <span className="hlb-chev" aria-hidden="true">{Icon.chevronRight}</span>
    </motion.li>
  );
}

export default function HomeLeaderboard() {
  const reduced = useReducedMotion();
  const games = BOARD_GAMES
    .map((id) => GAMES.find((g) => g.id === id))
    .filter(Boolean);

  return (
    <section className="hlb glass" aria-labelledby="hlb-heading">
      <header className="hlb-head">
        <span className="hlb-head-ico" aria-hidden="true">{Icon.trophy}</span>
        <div>
          <h2 id="hlb-heading" className="hlb-title">Top of the boards</h2>
          <p className="hlb-sub">Best run on every PG.Play game we keep score on.</p>
        </div>
      </header>
      <ol className="hlb-list">
        {games.map((game, i) => (
          <HomeBoardRow key={game.id} game={game} index={i} reduced={!!reduced}/>
        ))}
      </ol>
    </section>
  );
}
