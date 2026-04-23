import Card from './Card.jsx';

export default function Collection({ collection, games, favs, onFav, onOpen, bests }) {
  const items = collection.ids.map((id) => games.find((g) => g.id === id)).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <section className="section collection" aria-labelledby={`coll-${collection.id}`}>
      <div className="section-head collection-head">
        <div>
          <h2 id={`coll-${collection.id}`} className="section-title">{collection.title}</h2>
          <p className="collection-blurb">{collection.blurb}</p>
        </div>
        <span className="section-count">{items.length}</span>
      </div>
      <div className="rail">
        {items.map((g) => (
          <Card key={g.id} game={g} fav={!!favs[g.id]} onFav={onFav} onOpen={() => onOpen(g)} best={bests?.[g.id]?.best}/>
        ))}
      </div>
    </section>
  );
}
