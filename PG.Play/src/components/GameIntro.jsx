import { lazy, Suspense, useEffect, useState } from 'react';
import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';
import GameShell from './GameShell.jsx';
import { useIsMobile } from '../input/useVirtualControls.jsx';

// Code-split every game so opening the lobby doesn't pull in Three.js or
// game-specific bundles. Games load on demand when the player clicks play.
const PLAYABLE = {
  connect4:   lazy(() => import('../games/Connect4Game.jsx')),
  eightball:  lazy(() => import('../games/EightBallGame.jsx')),
  g2048:      lazy(() => import('../games/Game2048.jsx')),
  cutrope:    lazy(() => import('../games/CutRopeGame.jsx')),
  hook:       lazy(() => import('../games/StickmanHookGame.jsx')),
  fps:        lazy(() => import('../games/RaycasterFPS.jsx')),
  grudgewood: lazy(() => import('../games/GrudgewoodGame.jsx')),
  arena:      lazy(() => import('../games/ArenaGame.jsx')),
  slipshot:   lazy(() => import('../games/SlipshotGame.jsx')),
  slither:    lazy(() => import('../games/SlitherLiteGame.jsx')),
  basket:     lazy(() => import('../games/HoopShotGame.jsx')),
  aow:        lazy(() => import('../games/EraLaneGame.jsx')),
  bloons:     lazy(() => import('../games/LoftDefenseGame.jsx')),
  vex:        lazy(() => import('../games/TraceGame.jsx')),
  bob:        lazy(() => import('../games/NightShiftGame.jsx')),
  goalbound:  lazy(() => import('../games/GoalboundGame.jsx')),
  fbwg:       lazy(() => import('../games/EmberTideGame.jsx')),
  badicecream: lazy(() => import('../games/FrostFightGame.jsx')),
  papa:        lazy(() => import('../games/ShortOrderGame.jsx')),
  happywheels: lazy(() => import('../games/FaceplantGame.jsx')),
};

// Per-game shell content. Keeps the shell generic while each game gets
// tailored goals / controls / tips in the companion panel.
const SHELL_CONFIG = {
  goalbound: {
    goals: {
      lead: 'Outscore your rival in 60 seconds — or sudden-death golden goal if you can’t.',
      bullets: [
        'First to 3 goals wins early.',
        'Wall-bounces are legal — use them for impossible angles.',
        'Hold kick to charge; release near the ball for a curler.',
      ],
    },
    controls: [
      { title: 'Player 1', items: [
        { keys: ['A','D'], label: 'Move left / right' },
        { keys: ['W'],     label: 'Jump' },
        { keys: ['S'],     label: 'Kick (hold to charge)' },
      ]},
      { title: 'Player 2', items: [
        { keys: ['←','→'], label: 'Move left / right' },
        { keys: ['↑'],     label: 'Jump' },
        { keys: ['/'],     label: 'Kick (hold to charge)' },
      ]},
      { title: 'Shell', items: [
        { keys: ['P'], label: 'Pause / resume' },
        { keys: ['R'], label: 'Restart match' },
        { keys: ['M'], label: 'Mute / unmute' },
        { keys: ['F'], label: 'Fullscreen' },
      ]},
    ],
    tips: [
      'Jumping keepers clear deep crosses but leave the line open.',
      'A running kick curves slightly up and away — great for finishes.',
      'On mobile, long-press Kick for a charged power shot.',
    ],
  },
  grudgewood: {
    goals: {
      lead: 'Survive the forest. Every death arms one more tree.',
      bullets: ['Checkpoints remember; traps remember you.', 'Commit to jumps, don’t hesitate.'],
    },
    controls: [
      { title: 'Movement', items: [
        { keys: ['A','D'], label: 'Run' },
        { keys: ['Space'], label: 'Jump' },
      ]},
    ],
    tips: ['Hold jump for height, tap for a nudge.', 'If it feels safe, it has killed someone.'],
  },
  slipshot: {
    goals: {
      lead: 'Three minutes of pure momentum. The combo meter decays the moment you stop.',
      bullets: ['Bronze is a clean run.', 'Silver chains slides.', 'Gold is flow.'],
    },
    controls: [
      { title: 'Movement', items: [
        { keys: ['WASD'],  label: 'Move' },
        { keys: ['Space'], label: 'Jump' },
        { keys: ['Shift'], label: 'Slide (ground) / Airdash (air)' },
        { keys: ['Mouse'], label: 'Aim' },
      ]},
      { title: 'Combat', items: [
        { keys: ['LMB'],       label: 'Fire' },
        { keys: ['1','2','Q'], label: 'Swap weapon' },
        { keys: ['R'],         label: 'Reload' },
      ]},
    ],
    tips: [
      'Airborne kills refund the dash — chain dash→kill→dash.',
      'Pulse spread tightens while moving; standing still costs accuracy.',
      'A kill within 1.5s keeps the combo climbing toward ×3.',
    ],
  },
  arena: {
    goals: { lead: 'Five kills to win. Real players drop in live.', bullets: ['Walls are friends.', 'Predict — don’t trust the crosshair.'] },
    controls: [
      { title: 'Controls', items: [
        { keys: ['WASD'],  label: 'Move' },
        { keys: ['Mouse'], label: 'Aim' },
        { keys: ['Click'], label: 'Fire' },
      ]},
    ],
    tips: ['Never stand still.', 'Bots are training wheels — real players arrive unannounced.'],
  },
};

const MODE_OPTIONS = {
  goalbound: () => [
    { id: 'bot',      label: 'Quick Match',      tone: 'primary' },
    { id: '2p',       label: 'Local Versus',     tone: 'ghost', desktopOnly: true },
    { id: 'shootout', label: 'Penalty Shootout', tone: 'ghost' },
  ],
  _vsDefault: (game) => [
    { id: '2p',  label: game.players.includes('1-8') ? 'Join arena' : '2 Player', tone: 'primary' },
    ...(game.players.includes('1-8') ? [] : [{ id: 'bot', label: 'vs Bot', tone: 'ghost' }]),
  ],
  _storyDefault: (game) => [
    { id: 'start', label: game.players.includes('co-op') ? 'Start Co-op' : 'Start Story', tone: 'primary' },
  ],
};

const getModeOptions = (game) => {
  if (MODE_OPTIONS[game.id]) return MODE_OPTIONS[game.id](game);
  if (game.kind === 'vs') return MODE_OPTIONS._vsDefault(game);
  return MODE_OPTIONS._storyDefault(game);
};

function PlayPlaceholder({ game }) {
  const Cover = GAME_COVERS[game.id];
  return (
    <div className="play-placeholder">
      <div className="play-placeholder-art">{Cover && <Cover/>}</div>
      <div>
        <div className="play-placeholder-kicker">Coming soon</div>
        <div className="play-placeholder-title">Chapter queued</div>
        <div className="play-placeholder-sub">
          The playable build for {game.name} ships in a future update. Try
          {' '}<b>Goalbound</b>, <b>Slipshot</b>, or <b>Grudgewood</b> in the meantime.
        </div>
      </div>
    </div>
  );
}

function LoadingGame({ game }) {
  return (
    <div className="play-placeholder">
      <div className="play-placeholder-kicker">Loading</div>
      <div className="play-placeholder-title">{game.name}</div>
      <div className="play-placeholder-sub">Hang on while the game boots up.</div>
    </div>
  );
}

export default function GameIntro({ game, best, onClose }) {
  const [stage, setStage]        = useState('intro');
  const [mode, setMode]          = useState(null);
  const [restartKey, setRestart] = useState(0);
  const Cover = GAME_COVERS[game.id];
  const isMobile = useIsMobile();
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
  const shellCfg = SHELL_CONFIG[game.id] || {};

  if (stage === 'play') {
    const GameComp = PLAYABLE[game.id];
    return (
      <div className="intro intro-playing">
        <GameShell
          game={game}
          mode={mode}
          best={best}
          onExit={onClose}
          onRestart={() => setRestart((k) => k + 1)}
          goals={shellCfg.goals}
          controls={shellCfg.controls}
          tips={shellCfg.tips}
          helpTitle={`${game.name} — how to play`}>
          {GameComp ? (
            <Suspense fallback={<LoadingGame game={game}/>}>
              <GameComp key={restartKey} mode={mode}/>
            </Suspense>
          ) : <PlayPlaceholder game={game}/>}
        </GameShell>
      </div>
    );
  }

  return (
    <div className="intro" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <button className="intro-back" onClick={onClose} aria-label="Back to lobby">
        {Icon.back} Back
      </button>
      <div className="intro-body">
        <div className="intro-cover" aria-hidden="true">
          {Cover && <Cover/>}
        </div>
        <div className="intro-copy">
          <div className="intro-eyebrow">
            {game.cat} · {game.players} · {game.levels === '∞' ? 'endless' : `${game.levels} levels`}
            {best !== undefined && best !== null && <> · your best {best}</>}
          </div>
          <h1 id="intro-title" className="intro-title">{game.name}</h1>
          <div className="intro-tagline">{game.tagline}</div>
          <p className="intro-story">{game.story}</p>

          <div className="intro-cta-label">
            {game.kind === 'vs' ? 'Choose your match' : 'Ready when you are'}
          </div>
          <div className="intro-ctas">
            {modes.map((m) => {
              const blocked = m.desktopOnly && isMobile;
              return (
                <button
                  key={m.id}
                  className={`btn ${m.tone === 'primary' ? 'btn-primary' : 'btn-ghost'}${blocked ? ' is-disabled' : ''}`}
                  onClick={() => !blocked && start(m.id)}
                  disabled={blocked}
                  title={blocked ? 'Best on desktop — pass the laptop for local versus' : undefined}>
                  {m.tone === 'primary' && Icon.play}
                  <span>{m.label}</span>
                  {blocked && <span className="intro-cta-hint">desktop</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
