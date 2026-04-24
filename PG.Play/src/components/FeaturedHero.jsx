import { useMemo } from 'react';
import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';

const DEVICE_LABEL = {
  'native':        { icon: 'phone',   label: 'Mobile ready' },
  'touch-ok':      { icon: 'phone',   label: 'Works on phone' },
  'desktop-first': { icon: 'monitor', label: 'Best on desktop' },
  'desktop-only':  { icon: 'monitor', label: 'Desktop only' },
};

const SESSION_LABEL = {
  instant: 'Under 2 min',
  short:   '~3 min',
  medium:  '~6 min',
  long:    '10+ min',
};

const PLAYER_LABEL = (g) => {
  if (g.players === '1P') return 'Solo';
  if (g.players.includes('co-op')) return 'Co-op 1–2';
  if (g.players.includes('1-8')) return 'Up to 8';
  if (g.kind === 'vs') return '1 or 2 players';
  return g.players;
};

export default function FeaturedHero({ game, fav, onFav, onOpen, best }) {
  if (!game) return null;
  const Cover = GAME_COVERS[game.id];
  const device = DEVICE_LABEL[game.mobileSupport];
  const session = SESSION_LABEL[game.sessionLength];
  const chips = useMemo(() => {
    const out = [];
    if (game.isOriginal) out.push({ icon: 'sparkle', label: 'PG.Play Original', tone: 'accent' });
    out.push({ icon: game.kind === 'vs' ? 'versus' : 'solo', label: PLAYER_LABEL(game) });
    if (device) out.push({ icon: device.icon, label: device.label });
    if (session) out.push({ icon: 'clock', label: session });
    (game.skillTags || []).slice(0, 2).forEach(tag => out.push({ icon: 'bolt', label: tag }));
    return out;
  }, [game, device, session]);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="feature-hero">
        <div className="feature-hero-copy">
          <div className="feature-hero-eyebrow">
            <span className="feature-hero-kicker">Featured</span>
            <span className="feature-hero-dot"/>
            <span>{game.cat}</span>
            {game.badge && (
              <span className={`feature-hero-badge feature-hero-badge-${game.badge}`}>{game.badge}</span>
            )}
          </div>
          <h1 id="hero-title" className="feature-hero-title">{game.name}</h1>
          <p className="feature-hero-tagline">{game.tagline}</p>
          <p className="feature-hero-story">{game.story}</p>
          <div className="feature-hero-chips">
            {chips.map((c, i) => (
              <span key={i} className={`chip ${c.tone === 'accent' ? 'chip-accent' : 'chip-ghost'}`}>
                {Icon[c.icon]} <span>{c.label}</span>
              </span>
            ))}
          </div>
          <div className="feature-hero-actions">
            <button className="btn btn-lg btn-primary feature-hero-play" onClick={onOpen}>
              {Icon.play} Play now
            </button>
            <button
              className={'btn btn-lg btn-ghost feature-hero-save' + (fav ? ' is-active' : '')}
              onClick={() => onFav(game.id)}
              aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}>
              {fav ? Icon.heartF : Icon.heart}
              <span>{fav ? 'Saved' : 'Save'}</span>
            </button>
            {best !== undefined && best !== null && (
              <div className="feature-hero-best" aria-label={`Personal best ${best}`}>
                <span className="feature-hero-best-kicker">Your best</span>
                <span className="feature-hero-best-score">{best}</span>
              </div>
            )}
          </div>
        </div>
        <div className="feature-hero-art" aria-hidden="true">
          <div className="feature-hero-glow"/>
          <div className="feature-hero-art-inner">
            {Cover && <Cover/>}
          </div>
          <div className="feature-hero-art-frame"/>
        </div>
      </div>
    </section>
  );
}
