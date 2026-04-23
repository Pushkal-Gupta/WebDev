import { lazy, Suspense, useEffect, useState } from 'react';
import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';

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
  nightcap:   lazy(() => import('../games/NightcapGame.jsx')),
};

const modeLabel = (mode, game) => {
  if (mode === '2p')    return '2 Player';
  if (mode === 'bot')   return 'vs Bot';
  if (mode === 'start') return game.players.includes('co-op') ? 'Co-op' : 'Story';
  return '';
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
          The playable build for {game.name} ships in a future update. In the meantime, try
          {' '}<b>2048</b>, <b>Slipshot</b>, or <b>Grudgewood</b> for a live demo.
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
  const [stage, setStage] = useState('intro');
  const [mode, setMode] = useState(null);
  const Cover = GAME_COVERS[game.id];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (stage === 'play') setStage('intro');
        else onClose();
      }
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
      <div className="intro">
        <div className="play">
          <div className="play-topbar">
            <button className="btn btn-ghost" onClick={() => setStage('intro')}>
              {Icon.back} Back
            </button>
            <div className="play-title">
              {game.name} <span className="play-title-meta">· {modeLabel(mode, game)}</span>
            </div>
          </div>
          <div className="play-stage">
            {GameComp ? (
              <Suspense fallback={<LoadingGame game={game}/>}>
                <GameComp/>
              </Suspense>
            ) : <PlayPlaceholder game={game}/>}
          </div>
        </div>
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
            {game.kind === 'vs' ? (
              <>
                <button className="btn btn-primary" onClick={() => start('2p')}>
                  {Icon.play} {game.players.includes('1-8') ? 'Join arena' : '2 Player'}
                </button>
                {!game.players.includes('1-8') && (
                  <button className="btn btn-ghost" onClick={() => start('bot')}>
                    vs Bot
                  </button>
                )}
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => start('start')}>
                {Icon.play} {game.players.includes('co-op') ? 'Start Co-op' : 'Start Story'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
