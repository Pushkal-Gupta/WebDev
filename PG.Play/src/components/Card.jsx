import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';

export default function Card({ game, size = 'normal', fav, onFav, onOpen }) {
  const Cover = GAME_COVERS[game.id];
  const cls = 'pd-card'
    + (size === 'featured' ? ' pd-card--featured' : size === 'small' ? ' pd-card--small' : '');
  return (
    <div className={cls} onClick={onOpen}>
      <div className="pd-card-art">
        {Cover && <Cover/>}
        <div className="pd-card-badges">
          {game.badge === 'co-op' && <span className="pd-badge coop">Co-op</span>}
          {game.badge === 'new'   && <span className="pd-badge new">New</span>}
          {game.badge === 'hot'   && <span className="pd-badge trending">Hot</span>}
          {game.playable          && <span className="pd-badge" style={{color:'var(--accent)'}}>Playable</span>}
        </div>
        <button
          className={'pd-card-fav' + (fav ? ' active' : '')}
          onClick={(e) => { e.stopPropagation(); onFav(game.id); }}
          aria-label="Favorite">
          {fav ? Icon.heartF : Icon.heart}
        </button>
        <div className="pd-card-play">
          <button className="pd-play-btn" aria-label="Play">{Icon.play}</button>
        </div>
      </div>
      <div className="pd-card-footer">
        <div style={{minWidth:0}}>
          <div className="pd-card-name">{game.name}</div>
          <div className="pd-card-meta">
            {game.cat} · {game.players} · {game.levels === '∞' ? '∞ levels' : `${game.levels} levels`}
          </div>
        </div>
      </div>
    </div>
  );
}
