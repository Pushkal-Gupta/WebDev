import Card from './Card.jsx';

export default function HeroMosaic({ games, onOpen, favs, onFav }) {
  const featured = games.find(g => g.featured) || games[0];
  const small = games.filter(g => g.id !== featured.id).slice(0, 3);
  return (
    <div className="pd-mosaic">
      <Card game={featured} size="featured" fav={favs[featured.id]} onFav={onFav} onOpen={() => onOpen(featured)}/>
      {small.map(g => (
        <Card key={g.id} game={g} size="small" fav={favs[g.id]} onFav={onFav} onOpen={() => onOpen(g)}/>
      ))}
    </div>
  );
}
