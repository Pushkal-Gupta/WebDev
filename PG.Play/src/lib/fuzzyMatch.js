// Dependency-free fuzzy matcher for the PG.Play command palette.
//
// Scoring formula (per game, per query):
//   1. Exact title match              → +1000
//   2. Title startsWith query         → +400
//   3. Substring hits:
//        title contains query         → +180
//        tagline contains query       → +60
//        cat contains query           → +90
//        any skillTag contains query  → +50
//        any alias contains query     → +120
//        alias startsWith query       → +220
//        alias exact match            → +500
//   4. Subsequence (Sublime-style):
//        for each query char that matches title in order, +12
//        gap penalty: subtract (gapDistance * 1.2) since the previous match
//        +18 bonus if the match lands on a word boundary (start/space/dash)
//   5. Final multiplier:  playable games multiply final score by 2.0
//
// Threshold: a result is included when score >= 8. The palette's
// "nearest neighbours" recovery widens that to >= 1 so we still surface
// partial-score games even when nothing crosses the bar.

const ALIASES = {
  slither:    ['snake', 'io', 'coil', 'worm'],
  slipshot:   ['fps', 'shooter', 'krunker', 'movement'],
  grudgewood: ['rage', 'platformer', 'trees', 'forest', 'rage game'],
  goalbound:  ['football', 'soccer', 'sports', 'dvadi', 'kick'],
  g2048:      ['2048', 'merge', 'tiles', 'numbers'],
  connect4:   ['four', 'in a row', 'connect', 'connect four'],
};

export function aliasesFor(id) {
  return ALIASES[id] || [];
}

// Subsequence score with gap penalty + word-boundary bonus.
// Returns an integer score (0 = no subsequence found).
function subsequenceScore(needle, hay) {
  if (!needle || !hay) return 0;
  const n = needle.length;
  const h = hay.length;
  let i = 0;
  let lastIdx = -1;
  let score = 0;
  for (let j = 0; j < h && i < n; j++) {
    if (hay[j] === needle[i]) {
      // Base hit value.
      let hit = 12;
      // Word boundary bonus: start, or after space/-/_.
      if (j === 0 || hay[j - 1] === ' ' || hay[j - 1] === '-' || hay[j - 1] === '_') {
        hit += 18;
      }
      // Gap penalty (distance from previous match).
      if (lastIdx !== -1) {
        const gap = j - lastIdx - 1;
        hit -= Math.min(20, Math.round(gap * 1.2));
      }
      score += hit;
      lastIdx = j;
      i++;
    }
  }
  // Only credit when the entire needle is matched as a subsequence.
  return i === n ? Math.max(0, score) : 0;
}

function bestAliasScore(needle, aliases) {
  let best = 0;
  for (const a of aliases) {
    const al = a.toLowerCase();
    if (al === needle) best = Math.max(best, 500);
    else if (al.startsWith(needle)) best = Math.max(best, 220);
    else if (al.includes(needle)) best = Math.max(best, 120);
    else {
      const sub = subsequenceScore(needle, al);
      if (sub > 0) best = Math.max(best, Math.round(sub * 0.6));
    }
  }
  return best;
}

// Score a single game against a query. Returns 0 if no signal at all.
export function scoreGame(game, rawQuery) {
  const q = (rawQuery || '').trim().toLowerCase();
  if (!q) return 0;

  const name    = (game.name || '').toLowerCase();
  const cat     = (game.cat || '').toLowerCase();
  const tagline = (game.tagline || '').toLowerCase();
  const skills  = Array.isArray(game.skillTags) ? game.skillTags.map((s) => s.toLowerCase()) : [];
  const aliases = aliasesFor(game.id);

  let score = 0;

  if (name === q) score += 1000;
  else if (name.startsWith(q)) score += 400;
  else if (name.includes(q)) score += 180;

  if (tagline.includes(q)) score += 60;
  if (cat.includes(q)) score += 90;
  if (skills.some((s) => s.includes(q))) score += 50;

  score += bestAliasScore(q, aliases);

  // Subsequence over the title is the most informative free-form signal.
  score += subsequenceScore(q, name);
  // Lighter subsequence credit on category for queries like "puz" → "Puzzle".
  score += Math.round(subsequenceScore(q, cat) * 0.4);

  if (game.playable) score *= 2.0;

  return Math.round(score);
}

// Rank a list of games against a query.
// Returns [{ game, score }] sorted by score descending.
// Items with score < threshold are dropped from the main result list.
export function rankGames(games, query, { threshold = 8 } = {}) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const out = [];
  for (const g of games) {
    const s = scoreGame(g, q);
    if (s >= threshold) out.push({ game: g, score: s });
  }
  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Secondary: playable first, then alphabetical title.
    if (!!b.game.playable !== !!a.game.playable) return b.game.playable ? 1 : -1;
    return a.game.name.localeCompare(b.game.name);
  });
  return out;
}

// Nearest-neighbour fallback when nothing crosses the threshold.
// Returns up to `limit` partial matches (any positive score).
export function nearestNeighbours(games, query, limit = 3) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const out = [];
  for (const g of games) {
    const s = scoreGame(g, q);
    if (s > 0) out.push({ game: g, score: s });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}
