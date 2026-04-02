/**
 * Swiss pairing (Monrad/Dutch system).
 *
 * Input:
 *   players  — array of { user_id, username, score, buchholz, seed_rating, has_bye }
 *   history  — array of { white_user_id, black_user_id } (all previous pairings)
 *
 * Returns:
 *   array of { white_user_id, black_user_id }  (black_user_id = null → bye)
 *
 * Algorithm:
 *  1. Sort players: score DESC, seed_rating DESC
 *  2. Split into top half and bottom half
 *  3. Pair top[0] with bottom[0], top[1] with bottom[1], ...
 *  4. If a pair has already played, swap the lower-half player with the next one
 *  5. The leftover player (odd count) gets a bye (if they haven't had one)
 *  6. Alternate colours if possible (track colour balance per player)
 */

function havePlayed(history, a, b) {
  return history.some(
    p => (p.white_user_id === a && p.black_user_id === b) ||
         (p.white_user_id === b && p.black_user_id === a)
  );
}

/**
 * Count how many times a player was white / black in prior rounds.
 * Returns { white, black } counts.
 */
function colourCounts(history, userId) {
  let white = 0, black = 0;
  for (const p of history) {
    if (p.white_user_id === userId) white++;
    if (p.black_user_id === userId) black++;
  }
  return { white, black };
}

/**
 * Assign colours for a pairing (a, b).
 * Prefers the player who has been black more to be white (and vice versa).
 * If equal, keep the higher-ranked player as white.
 */
function assignColours(history, a, b) {
  const ca = colourCounts(history, a);
  const cb = colourCounts(history, b);
  const balA = ca.white - ca.black; // positive = played more white
  const balB = cb.white - cb.black;

  if (balA < balB) return { white: a, black: b }; // a needs more white
  if (balB < balA) return { white: b, black: a };
  return { white: a, black: b };                   // default: keep order
}

export function computeSwissPairings(players, history) {
  if (!players || players.length < 2) return [];

  // Sort by score DESC, seed_rating DESC
  const sorted = [...players]
    .filter(p => !p.withdrawn)
    .sort((a, b) =>
      b.score - a.score || b.seed_rating - a.seed_rating
    );

  const paired  = new Set();
  const pairings = [];

  // Handle bye for odd count
  let byePlayer = null;
  if (sorted.length % 2 !== 0) {
    // Give bye to lowest-ranked player who hasn't had a bye yet
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (!sorted[i].has_bye) {
        byePlayer = sorted[i];
        sorted.splice(i, 1);
        break;
      }
    }
    // If all have byes already, give to last player anyway
    if (!byePlayer) {
      byePlayer = sorted.pop();
    }
    if (byePlayer) pairings.push({ white_user_id: byePlayer.user_id, black_user_id: null });
  }

  // Dutch pairing: top half vs bottom half with swap-on-conflict
  const half = Math.floor(sorted.length / 2);
  const top  = sorted.slice(0, half);
  const bot  = sorted.slice(half);

  for (let i = 0; i < top.length; i++) {
    const a = top[i];
    if (paired.has(a.user_id)) continue;

    // Find first available bottom player they haven't played
    let matched = false;
    for (let j = 0; j < bot.length; j++) {
      const b = bot[j];
      if (paired.has(b.user_id)) continue;
      if (havePlayed(history, a.user_id, b.user_id)) continue;

      const { white, black } = assignColours(history, a.user_id, b.user_id);
      pairings.push({ white_user_id: white, black_user_id: black });
      paired.add(a.user_id);
      paired.add(b.user_id);
      matched = true;
      break;
    }

    // If no fresh opponent, pair with closest available (even if repeat)
    if (!matched) {
      for (let j = 0; j < bot.length; j++) {
        const b = bot[j];
        if (paired.has(b.user_id)) continue;
        const { white, black } = assignColours(history, a.user_id, b.user_id);
        pairings.push({ white_user_id: white, black_user_id: black });
        paired.add(a.user_id);
        paired.add(b.user_id);
        break;
      }
    }
  }

  return pairings;
}

/**
 * Update scores and buchholz for all players after a round.
 *
 * @param {object[]} players  — current tournament_players rows
 * @param {object[]} results  — tournament_pairings rows for the just-finished round
 *   result field: 'white'|'black'|'draw'|'bye'
 *
 * @returns {object[]} updated player rows (spread-ready for upsert)
 */
export function applyRoundResults(players, results) {
  const map = Object.fromEntries(players.map(p => [p.user_id, { ...p }]));

  for (const r of results) {
    if (r.result === 'bye') {
      if (map[r.white_user_id]) {
        map[r.white_user_id].score  += 1;
        map[r.white_user_id].has_bye = true;
      }
      continue;
    }
    if (!r.result || !r.white_user_id || !r.black_user_id) continue;

    const w = map[r.white_user_id];
    const b = map[r.black_user_id];
    if (!w || !b) continue;

    if (r.result === 'white') {
      w.score += 1; w.wins   += 1;
      b.score += 0; b.losses += 1;
    } else if (r.result === 'black') {
      b.score += 1; b.wins   += 1;
      w.score += 0; w.losses += 1;
    } else if (r.result === 'draw') {
      w.score += 0.5; w.draws += 1;
      b.score += 0.5; b.draws += 1;
    }
  }

  // Recompute buchholz = sum of opponents' current scores
  for (const r of results) {
    if (!r.white_user_id || !r.black_user_id || r.result === 'bye') continue;
    const w = map[r.white_user_id];
    const b = map[r.black_user_id];
    if (w && b) {
      w.buchholz = (w.buchholz || 0) + (b.score || 0);
      b.buchholz = (b.buchholz || 0) + (w.score || 0);
    }
  }

  return Object.values(map);
}
