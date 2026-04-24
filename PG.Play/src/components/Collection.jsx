import Card from './Card.jsx';
import { Icon } from '../icons.jsx';

export default function Collection({ collection, games, favs, onFav, onOpen, bests, variant = 'rail', onOpenAll }) {
  const items = collection.ids.map((id) => games.find((g) => g.id === id)).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <section className={`section collection collection-${variant}`} aria-labelledby={`coll-${collection.id}`}>
      <div className="section-head collection-head">
        <div className="collection-head-text">
          <h2 id={`coll-${collection.id}`} className="section-title">{collection.title}</h2>
          <p className="collection-blurb">{collection.blurb}</p>
        </div>
        <div className="collection-head-meta">
          <span className="section-count">{items.length} titles</span>
          {onOpenAll && (
            <button className="btn btn-subtle btn-sm" onClick={() => onOpenAll(collection.id)}>
              See all {Icon.chevronRight}
            </button>
          )}
        </div>
      </div>
      <div className="rail">
        {items.map((g) => (
          <Card key={g.id} game={g} fav={!!favs[g.id]} onFav={onFav} onOpen={() => onOpen(g)} best={bests?.[g.id]?.best}/>
        ))}
      </div>
    </section>
  );
}
