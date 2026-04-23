import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';

export default function Card({ game, fav, onFav, onOpen }) {
  const Cover = GAME_COVERS[game.id];
  return (
    <div className="card" onClick={onOpen} role="button" tabIndex={0}
         onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}>
      <div className="card-cover" aria-label={game.name}>
        {Cover && <Cover/>}
        <button
          className={'card-fav' + (fav ? ' is-active' : '')}
          onClick={(e) => { e.stopPropagation(); onFav(game.id); }}
          aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}>
          {fav ? Icon.heartF : Icon.heart}
        </button>
      </div>
      <div className="card-body">
        <div className="card-title">
          {game.playable && <span className="card-dot" aria-hidden="true"/>}
          <span>{game.name}</span>
        </div>
        <div className="card-meta">
          {game.cat} · {game.players} · {game.levels === '∞' ? 'endless' : `${game.levels} levels`}
        </div>
      </div>
    </div>
  );
}
