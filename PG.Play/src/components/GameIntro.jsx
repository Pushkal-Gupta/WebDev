// GameIntro — premium game lobby surface.
//
// Two-column layout on desktop: cover (left, in a glass frame with a
// genre-tinted glow) and meta + story + CTAs + leaderboard (right).
// On mobile (<820px) the cover stacks above the copy.
//
// The accent for this page is piped through as `--accent-this-page` on
// the root container. It drives the cover glow, primary CTA hover, and
// the leaderboard rank highlights. Map: cat → CSS var:
//   Rage / FPS    → --genre-action
//   Sports        → --genre-sports
//   Arcade        → --genre-arcade
//   Puzzle/Classic→ --genre-puzzle
//
// Motion: cover slides up + fades, copy staggers in. `useReducedMotion`
// from framer-motion neutralises both when the user opts out.

import { lazy, Suspense, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';
import GameShell from './GameShell.jsx';
import Leaderboard from './Leaderboard.jsx';
import { useIsMobile } from '../input/useVirtualControls.jsx';
import { useCanRender3D } from '../hooks/useCanRender3D.js';

const GameAmbient = lazy(() => import('./three/GameAmbient.jsx'));

// Games whose scores are validated server-side and live on the public leaderboard.
const LEADERBOARD_GAMES = new Set(['slither', 'slipshot', 'grudgewood', 'goalbound', 'g2048', 'connect4']);

// Code-split every game so opening the lobby doesn't pull in Three.js or
// game-specific bundles. Games load on demand when the player clicks play.
const PLAYABLE = {
  connect4:    lazy(() => import('../games/Connect4Game.jsx')),
  eightball:   lazy(() => import('../games/EightBallGame.jsx')),
  g2048:       lazy(() => import('../games/Game2048.jsx')),
  cutrope:     lazy(() => import('../games/CutRopeGame.jsx')),
  hook:        lazy(() => import('../games/SwingwireGame.jsx')),
  fps:         lazy(() => import('../games/RaycasterFPS.jsx')),
  grudgewood:  lazy(() => import('../games/GrudgewoodGame.jsx')),
  arena:       lazy(() => import('../games/ArenaGame.jsx')),
  slipshot:    lazy(() => import('../games/SlipshotGame.jsx')),
  slither:     lazy(() => import('../games/SlitherLiteGame.jsx')),
  basket:      lazy(() => import('../games/HoopShotGame.jsx')),
  aow:         lazy(() => import('../games/EraLaneGame.jsx')),
  bloons:      lazy(() => import('../games/LoftDefenseGame.jsx')),
  vex:         lazy(() => import('../games/TraceGame.jsx')),
  bob:         lazy(() => import('../games/NightShiftGame.jsx')),
  goalbound:   lazy(() => import('../games/GoalboundGame.jsx')),
  fbwg:        lazy(() => import('../games/EmberTideGame.jsx')),
  badicecream: lazy(() => import('../games/FrostFightGame.jsx')),
  papa:        lazy(() => import('../games/ShortOrderGame.jsx')),
  happywheels: lazy(() => import('../games/FaceplantGame.jsx')),
  bricklands:  lazy(() => import('../games/BricklandsGame.jsx')),
};

const MODE_OPTIONS = {
  goalbound: () => [
    { id: 'arcade',   label: 'Enter Goalbound',  tone: 'primary' },
    { id: 'shootout', label: 'Penalty Shootout', tone: 'ghost' },
  ],
  aow: () => [
    { id: 'standard', label: 'Standard',  tone: 'primary' },
    { id: 'skirmish', label: 'Skirmish',  tone: 'ghost' },
    { id: 'conquest', label: 'Conquest',  tone: 'ghost' },
  ],
  _vsDefault: (game) => [
    { id: '2p',  label: game.players.includes('1-8') ? 'Join arena' : '2 Player', tone: 'primary' },
    ...(game.players.includes('1-8') ? [] : [{ id: 'bot', label: 'vs Bot', tone: 'ghost' }]),
  ],
  _storyDefault: (game) => [
    { id: 'start', label: game.players.includes('co-op') ? 'Start Co-op' : 'Start', tone: 'primary' },
  ],
};

const getModeOptions = (game) => {
  if (MODE_OPTIONS[game.id]) return MODE_OPTIONS[game.id](game);
  if (game.kind === 'vs') return MODE_OPTIONS._vsDefault(game);
  return MODE_OPTIONS._storyDefault(game);
};

const CAT_TO_GENRE = {
  Rage:    'action',
  FPS:     'action',
  Sports:  'sports',
  Arcade:  'arcade',
  Puzzle:  'puzzle',
  Classic: 'puzzle',
};
function genreVar(cat) {
  return `var(--genre-${CAT_TO_GENRE[cat] || 'arcade'})`;
}

// Decide whether to show a "How to play" controls hint. If the game only
// accepts mouse or touch (or both), there are no keys to spell out — skip.
function hasKeyboardLikeInput(inputs = []) {
  return inputs.some((i) => i === 'keyboard' || i === 'tap' || i === 'swipe' || i === 'drag');
}

function ControlsHint({ game }) {
  const inputs = game.inputs || [];
  if (!hasKeyboardLikeInput(inputs) && !inputs.includes('keyboard')) return null;

  // Prefer keyboard hint; fall back to a generic tap/swipe line.
  const hasKb     = inputs.includes('keyboard');
  const hasMouse  = inputs.includes('mouse');
  const hasTouch  = inputs.includes('touch');
  const hasSwipe  = inputs.includes('swipe');

  let line;
  if (hasKb && hasMouse)        line = 'Move with WASD or arrows. Aim with the mouse.';
  else if (hasKb && hasTouch)   line = 'WASD / arrows on desktop. Tap to play on touch.';
  else if (hasKb)               line = 'WASD or arrows to move. Space / Enter to act.';
  else if (hasSwipe)            line = 'Swipe to move. Tap to confirm.';
  else                          line = 'Tap or click to play.';

  return (
    <div className="intro-howto" aria-label="How to play">
      <span className="intro-howto-ico" aria-hidden="true">{Icon.keyboard}</span>
      <div className="intro-howto-copy">
        <div className="intro-howto-title">How to play</div>
        <div className="intro-howto-line">{line}</div>
      </div>
    </div>
  );
}

function ShareButton({ game }) {
  const [shared, setShared] = useState(false);
  const url = `https://pushkalgupta.com/PG.Play/dist/#/game/${game.id}`;
  const onClick = async (e) => {
    e.preventDefault();
    const data = { title: `${game.name} — PG.Play`, text: game.tagline || '', url };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1600);
      }
    } catch {
      // User cancelled / not supported — silent.
    }
  };
  return (
    <button
      type="button"
      className="btn btn-lg btn-subtle intro-cta-share"
      onClick={onClick}
      title="Share this game"
      aria-label={`Share ${game.name}`}
    >
      {Icon.bookmark}
      <span>{shared ? 'Link copied' : 'Share'}</span>
    </button>
  );
}

function PlayPlaceholder({ game }) {
  const Cover = GAME_COVERS[game.id];
  return (
    <div className="play-placeholder">
      <div className="play-placeholder-art">{Cover && <Cover/>}</div>
      <div>
        <div className="play-placeholder-title">Coming soon</div>
        <div className="play-placeholder-sub">
          The build for {game.name} ships in a future update.
        </div>
      </div>
    </div>
  );
}

function LoadingGame() {
  return (
    <div className="play-loading" role="status" aria-live="polite">
      <div className="play-loading-bar"><div className="play-loading-bar-fill"/></div>
    </div>
  );
}

export default function GameIntro({ game, onClose }) {
  const [stage, setStage]        = useState('intro');
  const [mode, setMode]          = useState(null);
  const [restartKey, setRestart] = useState(0);
  const Cover = GAME_COVERS[game.id];
  const isMobile = useIsMobile();
  const reduced  = useReducedMotion();
  const can3D    = useCanRender3D();
  const modes = getModeOptions(game);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && stage !== 'play') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [stage, onClose]);

  const start = (m) => { setMode(m); setStage('play'); };

  if (stage === 'play') {
    const GameComp = PLAYABLE[game.id];
    return (
      <main id="main" className="intro intro-playing" aria-label={`${game.name} — playing`}>
        <GameShell
          game={game}
          mode={mode}
          onExit={onClose}
          onRestart={() => setRestart((k) => k + 1)}>
          {GameComp ? (
            <Suspense fallback={<LoadingGame/>}>
              <GameComp key={restartKey} mode={mode}/>
            </Suspense>
          ) : <PlayPlaceholder game={game}/>}
        </GameShell>
      </main>
    );
  }

  const accent = genreVar(game.cat);

  // Stagger choreography. `delayChildren` walks the copy column down.
  const copyVariants = {
    hidden: { opacity: 1 },
    show:   {
      opacity: 1,
      transition: reduced ? {} : { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };
  const itemVariants = reduced
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 12 },
        show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
      };
  const coverVariants = reduced
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 24 },
        show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
      };

  return (
    <main
      id="main"
      className="intro intro-premium"
      aria-labelledby="intro-title"
      style={{ '--accent-this-page': accent }}>
      <button className="intro-back" onClick={onClose} aria-label="Back to lobby">
        {Icon.back} Back
      </button>

      <div className="intro-body intro-body-premium">
        <motion.div
          className="intro-cover-frame"
          initial="hidden"
          animate="show"
          variants={coverVariants}>
          <div className="intro-cover-glow" aria-hidden="true"/>
          {can3D && (
            <Suspense fallback={null}>
              <GameAmbient gameId={game.id} cat={game.cat}/>
            </Suspense>
          )}
          <div className="intro-cover-art glass" aria-hidden="true">
            {Cover && <Cover/>}
          </div>
        </motion.div>

        <motion.div
          className="intro-copy intro-copy-premium"
          initial="hidden"
          animate="show"
          variants={copyVariants}>

          <motion.div className="intro-eyebrow" variants={itemVariants}>
            {game.cat}
          </motion.div>

          <motion.h1 id="intro-title" className="intro-title intro-title-xl" variants={itemVariants}>
            {game.name}
          </motion.h1>

          <motion.div className="intro-meta-strip" variants={itemVariants}>
            <span className="chip chip-sm">
              {Icon.sparkle}<span>{game.cat}</span>
            </span>
            <span className="chip chip-sm">
              {game.kind === 'vs' ? Icon.versus : Icon.solo}<span>{game.players}</span>
            </span>
            <span className="chip chip-sm">
              {Icon.star}<span>{game.levels === '∞' ? 'Endless' : `${game.levels} levels`}</span>
            </span>
          </motion.div>

          <motion.div className="intro-tagline" variants={itemVariants}>
            {game.tagline}
          </motion.div>

          <motion.p className="intro-story" variants={itemVariants}>
            {game.story}
          </motion.p>

          <motion.div className="intro-ctas intro-ctas-premium" variants={itemVariants}>
            {modes.map((m) => {
              const blocked = m.desktopOnly && isMobile;
              const isPrimary = m.tone === 'primary';
              return (
                <button
                  key={m.id}
                  className={`btn btn-lg ${isPrimary ? 'btn-primary intro-cta-primary' : 'btn-ghost intro-cta-ghost'}${blocked ? ' is-disabled' : ''}`}
                  onClick={() => !blocked && start(m.id)}
                  disabled={blocked}
                  title={blocked ? 'Best on desktop' : undefined}>
                  {isPrimary && Icon.play}
                  <span>{m.label}</span>
                </button>
              );
            })}
            <ShareButton game={game}/>
          </motion.div>

          <motion.div variants={itemVariants}>
            <ControlsHint game={game}/>
          </motion.div>

          {LEADERBOARD_GAMES.has(game.id) && (
            <motion.div variants={itemVariants}>
              <Leaderboard gameId={game.id}/>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
