// GamePage — routed surface at /game/:id.
//
// Responsibilities:
//   • Resolve the game by id from the URL; redirect home on miss.
//   • Reuse the existing GameIntro component (lobby + mode picker + shell)
//     so we don't duplicate the SHELL_CONFIG / lazy-import map.
//   • Persist last-played in localStorage so /game/<last> can be the
//     default future entry point.
//   • Prevent the browser from eating arrow / space keys for page scroll
//     while a game is mounted. Games preventDefault inside their own
//     handlers; this is a safety net for the brief Suspense-fallback
//     window before the chunk loads.
//   • Lock body scroll while on the route so the canvas owns the viewport.

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GAMES } from '../data.js';
import GameIntro from '../components/GameIntro.jsx';
import { useSession } from '../hooks/useSession.js';
import { useBests } from '../hooks/useBests.js';

// Keys we don't want the browser to handle while a game is up.
// Arrow keys scroll the page; Space pages down; '/' opens Quick Find.
const SUPPRESS_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  ' ', 'Spacebar', '/', 'Tab',
]);

function isTextTarget(t) {
  if (!t) return false;
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable;
}

export default function GamePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const game = GAMES.find((g) => g.id === id);
  const { user } = useSession();
  const { bests } = useBests(user);

  // Lock body scroll, persist last-game, isolate input keys.
  useEffect(() => {
    if (!game) return;
    localStorage.setItem('pd-last-game', game.id);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0 });

    const onKey = (e) => {
      if (isTextTarget(e.target)) return;
      if (SUPPRESS_KEYS.has(e.key)) e.preventDefault();
    };
    // Capture phase: we win against listeners that haven't called preventDefault yet.
    window.addEventListener('keydown', onKey, { capture: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey, { capture: true });
    };
  }, [game]);

  // Unknown id → bounce home.
  useEffect(() => {
    if (!game) navigate('/', { replace: true });
  }, [game, navigate]);

  if (!game) return null;

  return (
    <GameIntro
      game={game}
      best={bests[game.id]?.best}
      onClose={() => navigate('/')}
    />
  );
}
