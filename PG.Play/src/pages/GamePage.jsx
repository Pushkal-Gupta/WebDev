// GamePage — routed surface at /game/:id.
//
// Resolve the game by id; redirect home on miss. Lock body scroll and
// suppress browser keys (arrows/space/tab) so the canvas owns input.

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GAMES } from '../data.js';
import GameIntro from '../components/GameIntro.jsx';
import { startRun } from '../lib/runToken.js';
import { useSession } from '../hooks/useSession.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';

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

  useDocumentMeta(
    game
      ? {
          title: `${game.name} — PG.Play`,
          description: game.tagline || game.story?.slice(0, 160),
          url: `https://pushkalgupta.com/PG.Play/dist/#/game/${game.id}`,
        }
      : undefined,
  );

  // Issue a run token the moment a signed-in player lands on a game route.
  // submit-score will reject any score that doesn't reference one.
  useEffect(() => {
    if (!game || !user) return;
    startRun(game.id);
  }, [game, user]);

  useEffect(() => {
    if (!game) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('is-playing');
    window.scrollTo({ top: 0 });

    const onKey = (e) => {
      if (isTextTarget(e.target)) return;
      if (SUPPRESS_KEYS.has(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', onKey, { capture: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('is-playing');
      window.removeEventListener('keydown', onKey, { capture: true });
    };
  }, [game]);

  useEffect(() => {
    if (!game) navigate('/', { replace: true });
  }, [game, navigate]);

  if (!game) return null;

  return (
    <GameIntro
      game={game}
      onClose={() => navigate('/')}
    />
  );
}
