import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';

const DEVICE = {
  'native':        { icon: 'phone',   tone: 'accent', label: 'Mobile' },
  'touch-ok':      { icon: 'phone',   tone: 'ghost',  label: 'Touch ok' },
  'desktop-first': { icon: 'monitor', tone: 'ghost',  label: 'Desktop' },
  'desktop-only':  { icon: 'monitor', tone: 'ghost',  label: 'Desktop' },
};

export default function Card({ game, fav, onFav, onOpen, best, size = 'md' }) {
  const Cover = GAME_COVERS[game.id];
  const device = DEVICE[game.mobileSupport];
  const isNew = game.badge === 'new';
  const isOriginal = game.isOriginal;
  const skillPills = (game.skillTags || []).slice(0, 2);

  return (
    <div
      className={`card card-${size}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
    >
      <div className="card-cover" aria-label={game.name}>
        {Cover && <Cover/>}
        <div className="card-cover-shade"/>
        <button
          className={'card-fav' + (fav ? ' is-active' : '')}
          onClick={(e) => { e.stopPropagation(); onFav(game.id); }}
          aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
        >
          {fav ? Icon.heartF : Icon.heart}
        </button>
        <div className="card-badges">
          {isNew && <span className="card-badge card-badge-new">New</span>}
          {isOriginal && <span className="card-badge card-badge-original">Original</span>}
        </div>
        {best !== undefined && best !== null && (
          <div className="card-best" aria-label={`Personal best ${best}`}>
            {Icon.trophy}<span>Best {best}</span>
          </div>
        )}
        {device && (
          <div className={`card-device card-device-${device.tone}`} aria-label={device.label}>
            {Icon[device.icon]}<span>{device.label}</span>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">
          {game.playable && <span className="card-dot" aria-hidden="true"/>}
          <span>{game.name}</span>
        </div>
        <div className="card-meta">
          {game.cat} · {game.players} · {game.levels === '∞' ? 'endless' : `${game.levels} levels`}
        </div>
        {skillPills.length > 0 && (
          <div className="card-chips" aria-hidden="true">
            {skillPills.map((t) => (
              <span key={t} className="chip chip-sm chip-ghost">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
