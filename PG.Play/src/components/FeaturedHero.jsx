import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';

export default function FeaturedHero({ game, fav, onFav, onOpen }) {
  if (!game) return null;
  const Cover = GAME_COVERS[game.id];
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-card">
        <div className="hero-cover" aria-hidden="true">
          {Cover && <Cover/>}
        </div>
        <div className="hero-copy">
          <div className="hero-eyebrow">Featured · {game.cat}</div>
          <h1 id="hero-title" className="hero-title">{game.name}</h1>
          <p className="hero-desc">{game.story}</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onOpen}>
              {Icon.play} Play
            </button>
            <button
              className={'btn-icon' + (fav ? ' is-active' : '')}
              onClick={() => onFav(game.id)}
              aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}>
              {fav ? Icon.heartF : Icon.heart}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
