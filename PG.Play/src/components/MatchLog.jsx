const ENTRIES = [
  { g:'Connect 4',            w:'Player 1', l:'Bot (Hard)', s:'21–14',        t:'2m' },
  { g:'8-Ball Pool',          w:'Player 2', l:'Player 1',   s:'8 on break',   t:'9m' },
  { g:'Fireboy & Watergirl',  w:'Co-op',    l:'Lvl 12',     s:'4★',           t:'14m' },
  { g:'Bad Ice Cream',        w:'Co-op',    l:'Lvl 08',     s:'3★',           t:'22m' },
  { g:'Football Legends',     w:'Player 1', l:'Bot (Med)',  s:'3–2',          t:'31m' },
  { g:'Stickman Hook',        w:'Player 1', l:'Lvl 34',     s:'best: 1.8s',   t:'41m' },
  { g:'Age of War 2',         w:'Player 1', l:'Era IV',     s:'victory',      t:'1h' },
  { g:'Basket Champs',        w:'Player 1', l:'Player 2',   s:'21–18',        t:'1h' },
];

export default function MatchLog() {
  return (
    <div className="pd-log">
      <div className="pd-log-head">
        <span className="pd-log-dot"/> RECENT MATCHES
      </div>
      <div className="pd-log-track">
        <div className="pd-log-inner">
          {[...ENTRIES, ...ENTRIES].map((e, i) => (
            <span key={i} className="pd-log-item">
              <span className="pd-log-game">{e.g}</span>
              <span className="pd-log-winner">{e.w}</span>
              <span className="pd-log-vs">vs</span>
              <span className="pd-log-loser">{e.l}</span>
              <span className="pd-log-score">{e.s}</span>
              <span className="pd-log-time">· {e.t} ago</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
