import { useEffect, useState } from 'react';
import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';
import Connect4Game from '../games/Connect4Game.jsx';
import EightBallGame from '../games/EightBallGame.jsx';

function modeLabel(mode, game) {
  if (mode === '2p')     return '2 Player local';
  if (mode === 'bot')    return 'vs Bot';
  if (mode === 'story')  return game.players.includes('co-op') ? 'Co-op story' : 'Story mode';
  if (mode === 'levels') return 'Level select';
  return '';
}

function ModeBtn({ title, meta, icon, onClick, hero }) {
  return (
    <button className={'pd-mode' + (hero ? ' pd-mode--hero' : '')} onClick={onClick}>
      <span className="pd-mode-icon">{icon}</span>
      <span className="pd-mode-text">
        <span className="pd-mode-title">{title}</span>
        <span className="pd-mode-meta">{meta}</span>
      </span>
      <span className="pd-mode-arrow">{Icon.arrow}</span>
    </button>
  );
}

function PlayPlaceholder({ game, mode }) {
  const Cover = GAME_COVERS[game.id];
  return (
    <div className="pd-play-placeholder">
      <div className="pd-play-placeholder-art">
        {Cover && <Cover/>}
      </div>
      <div>
        <div className="pd-pixel-label">PRESS START</div>
        <div className="pd-play-placeholder-title">Chapter queued</div>
        <div className="pd-play-placeholder-sub">
          {game.name} · {modeLabel(mode, game)} — ready to load. Playable build dropping in the next release. For a live demo try <b>Connect 4</b> or <b>8-Ball Pool</b>.
        </div>
      </div>
    </div>
  );
}

export default function GameIntro({ game, onClose }) {
  const [stage, setStage] = useState('intro');
  const [mode, setMode] = useState(null);
  const Cover = GAME_COVERS[game.id];

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const startMode = (m) => { setMode(m); setStage('play'); };

  return (
    <div className="pd-intro-overlay">
      <div className="pd-crt"/>
      <button className="pd-intro-close" onClick={onClose} aria-label="Close">
        <span style={{width:14,height:14,display:'inline-flex'}}>{Icon.back}</span>
        Back to lobby
      </button>

      {stage === 'intro' ? (
        <div className="pd-intro-body">
          <div className="pd-intro-cover">
            {Cover && <Cover/>}
            <div className="pd-intro-cover-shade"/>
          </div>
          <div className="pd-intro-copy">
            <div className="pd-intro-eyebrow">
              <span className="pd-pixel-dot"/> {game.cat} · {game.players} · {game.levels === '∞' ? 'Endless' : `${game.levels} levels`}
            </div>
            <h1 className="pd-intro-title">{game.name}</h1>
            <div className="pd-intro-tagline">{game.tagline}</div>
            <p className="pd-intro-story">{game.story}</p>

            <div className="pd-mode-label">
              {game.kind === 'vs' ? 'Choose your match' : 'Begin'}
            </div>
            <div className="pd-modes">
              {game.kind === 'story' ? (
                <>
                  <ModeBtn hero
                    title={game.players.includes('co-op') ? 'Start Co-op' : 'Start Story'}
                    meta={`Level 1 of ${game.levels === '∞' ? '∞' : game.levels}`}
                    icon={game.players.includes('co-op') ? Icon.users : Icon.user}
                    onClick={() => startMode('story')}/>
                  <ModeBtn
                    title="Level select"
                    meta="Jump to any unlocked chapter"
                    icon={Icon.sparkle}
                    onClick={() => startMode('levels')}/>
                </>
              ) : (
                <>
                  <ModeBtn hero
                    title="2 Player (local)"
                    meta="Same keyboard · hot-seat"
                    icon={Icon.users}
                    onClick={() => startMode('2p')}/>
                  <ModeBtn
                    title="vs Bot"
                    meta="Quick solo match"
                    icon={Icon.bot}
                    onClick={() => startMode('bot')}/>
                </>
              )}
            </div>

            <div className="pd-intro-foot">
              <span>↵ Enter to start</span>
              <span>esc to exit</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="pd-play-body">
          <div className="pd-play-topbar">
            <button className="pd-play-back" onClick={() => setStage('intro')}>
              <span style={{width:12,height:12,display:'inline-flex'}}>{Icon.back}</span>
              {game.name} · {modeLabel(mode, game)}
            </button>
            <div className="pd-play-status">
              <span className="pd-pixel-dot"/> READY
            </div>
          </div>
          <div className="pd-play-stage">
            {game.id === 'connect4'  ? <Connect4Game/>
              : game.id === 'eightball' ? <EightBallGame/>
              : <PlayPlaceholder game={game} mode={mode}/>}
          </div>
        </div>
      )}
    </div>
  );
}
