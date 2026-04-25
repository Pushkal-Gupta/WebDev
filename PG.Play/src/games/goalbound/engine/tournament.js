// GOALBOUND — tournament engine.
//
//   Deterministic fixture + standings + bracket generator.
//   Supports three templates:
//     - 'mini-cup'    4 teams round-robin (6 matches)
//     - 'continental' 2 groups of 4 → top 2 qualify → SF → F
//     - 'world'       8 teams straight knockouts (QF → SF → F)
//
//   Any team can be the player's team. Non-player matches are
//   simulated by a ratings-based mini-sim (see simulateMatch).

import { TEAMS } from '../content.js';
import { templateById } from '../content.js';

const shuffled = (arr, seed) => {
  const a = arr.slice();
  let s = seed | 0 || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0xffff) / 0x10000;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Pick N teams, ensuring the player's team is one of them.
export const pickTournamentTeams = ({ templateId, playerTeamId, seeded, seed }) => {
  const tpl = templateById(templateId);
  const all = TEAMS.slice();
  const player = all.find((t) => t.id === playerTeamId);
  const pool = all.filter((t) => t.id !== playerTeamId);
  const ordered = seeded
    ? pool.sort((a, b) => b.rating - a.rating)
    : shuffled(pool, seed || Date.now());
  const pick = ordered.slice(0, tpl.teams - 1);
  return [player, ...pick];
};

// Build fixtures for a round-robin group. Home team first.
const roundRobinPairs = (teams) => {
  const n = teams.length;
  const out = [];
  const ids = teams.map((t) => t.id);
  // Circle method.
  const list = ids.slice();
  if (list.length % 2 === 1) list.push(null); // bye
  const rounds = list.length - 1;
  const half = list.length / 2;
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = list[i], b = list[list.length - 1 - i];
      if (a && b) out.push({ round: r + 1, home: a, away: b });
    }
    // rotate keeping list[0] fixed
    const moved = [list[0], list[list.length - 1], ...list.slice(1, list.length - 1)];
    list.length = 0;
    list.push(...moved);
  }
  return out;
};

// Create fresh tournament state.
export const createTournament = ({ templateId, playerTeamId, seeded = true, seed = Date.now() }) => {
  const tpl  = templateById(templateId);
  const pool = pickTournamentTeams({ templateId, playerTeamId, seeded, seed });

  if (tpl.knockoutFrom === 'round-robin') {
    const fixtures = roundRobinPairs(pool).map((f, i) => ({ ...f, id: `m${i}`, score: null, done: false, phase: 'league' }));
    return {
      templateId,
      playerTeamId,
      phase: 'league',
      groups: [{ id:'A', teamIds: pool.map((t) => t.id) }],
      standings: blankStandings(pool.map((t) => t.id)),
      fixtures,
      bracket: null,
      champion: null,
      createdAt: Date.now(),
    };
  }

  if (tpl.knockoutFrom === 'straight') {
    const seeds = seeded ? pool.slice() : shuffled(pool, seed);
    const pairs = [];
    for (let i = 0; i < seeds.length / 2; i++) {
      pairs.push({ home: seeds[i].id, away: seeds[seeds.length - 1 - i].id });
    }
    const bracket = {
      rounds: [
        { name:'Quarter-finals', matches: pairs.map((p, i) => ({ id:`qf${i}`, home:p.home, away:p.away, score:null })) },
        { name:'Semi-finals',    matches: [{id:'sf0'},{id:'sf1'}] },
        { name:'Final',          matches: [{id:'f0'}] },
      ],
    };
    return {
      templateId, playerTeamId,
      phase:'knockout',
      groups: null, standings: null,
      fixtures: null,
      bracket, champion: null,
      createdAt: Date.now(),
    };
  }

  // Continental: 8 teams, 2 groups of 4, top 2 → semis → final
  const seeds = seeded ? pool.slice() : shuffled(pool, seed);
  const groupA = [seeds[0], seeds[3], seeds[4], seeds[7]];
  const groupB = [seeds[1], seeds[2], seeds[5], seeds[6]];
  const fixA = roundRobinPairs(groupA).map((f, i) => ({ ...f, id:`A-m${i}`, score:null, done:false, phase:'group', group:'A' }));
  const fixB = roundRobinPairs(groupB).map((f, i) => ({ ...f, id:`B-m${i}`, score:null, done:false, phase:'group', group:'B' }));
  return {
    templateId, playerTeamId,
    phase:'group',
    groups: [{ id:'A', teamIds: groupA.map((t) => t.id) }, { id:'B', teamIds: groupB.map((t) => t.id) }],
    standings: {
      A: blankStandings(groupA.map((t) => t.id)),
      B: blankStandings(groupB.map((t) => t.id)),
    },
    fixtures: [...fixA, ...fixB],
    bracket: {
      rounds: [
        { name:'Semi-finals', matches: [{id:'sf0'},{id:'sf1'}] },
        { name:'Final',       matches: [{id:'f0'}] },
      ],
    },
    champion: null,
    createdAt: Date.now(),
  };
};

const blankStandings = (teamIds) =>
  Object.fromEntries(teamIds.map((id) => [id, { p:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 }]));

// Apply a result row into standings.
const apply = (row, gf, ga) => {
  row.p += 1; row.gf += gf; row.ga += ga; row.gd = row.gf - row.ga;
  if (gf > ga)      { row.w += 1; row.pts += 3; }
  else if (gf < ga) { row.l += 1; }
  else              { row.d += 1; row.pts += 1; }
};

export const recordFixture = (state, fixtureId, homeGoals, awayGoals) => {
  const next = JSON.parse(JSON.stringify(state));
  const f = next.fixtures.find((x) => x.id === fixtureId);
  if (!f) return next;
  f.score = { home: homeGoals, away: awayGoals };
  f.done = true;

  const which = next.standings && next.standings[f.group] ? next.standings[f.group]
              : (next.standings || null);
  if (which) {
    apply(which[f.home], homeGoals, awayGoals);
    apply(which[f.away], awayGoals, homeGoals);
  }

  // If this was the final league match of a round-robin-only tournament,
  // compute champion.
  const tpl = templateById(next.templateId);
  if (tpl.knockoutFrom === 'round-robin') {
    if (next.fixtures.every((x) => x.done)) {
      const rows = Object.entries(next.standings).sort(sortStanding);
      next.champion = rows[0][0];
      next.phase = 'done';
    }
  }

  // Group stage completion for continental.
  if (tpl.knockoutFrom === 'group') {
    const groupFixDone = (g) => next.fixtures.filter((x) => x.group === g).every((x) => x.done);
    if (next.phase === 'group' && groupFixDone('A') && groupFixDone('B')) {
      const topA = topTwo(next.standings.A);
      const topB = topTwo(next.standings.B);
      next.bracket.rounds[0].matches = [
        { id:'sf0', home: topA[0], away: topB[1], score:null },
        { id:'sf1', home: topB[0], away: topA[1], score:null },
      ];
      next.phase = 'knockout-sf';
    }
  }
  return next;
};

const sortStanding = ([, a], [, b]) =>
  b.pts - a.pts || b.gd - a.gd || b.gf - a.gf;

const topTwo = (standings) => {
  const rows = Object.entries(standings).sort(sortStanding);
  return [rows[0][0], rows[1][0]];
};

// Record a knockout match result. Mutates into bracket.
export const recordKnockout = (state, matchId, homeGoals, awayGoals) => {
  const next = JSON.parse(JSON.stringify(state));
  const tpl  = templateById(next.templateId);
  let winner = homeGoals > awayGoals ? 'home' : awayGoals > homeGoals ? 'away' : null;

  // Walk bracket rounds.
  for (let r = 0; r < next.bracket.rounds.length; r++) {
    const round = next.bracket.rounds[r];
    const m = round.matches.find((x) => x.id === matchId);
    if (!m) continue;
    m.score = { home: homeGoals, away: awayGoals };

    // Coin-flip tie-breaker for drawn knockouts.
    if (!winner) winner = Math.random() < 0.5 ? 'home' : 'away';
    const winId = winner === 'home' ? m.home : m.away;
    m.winner = winId;

    // Propagate winner into next round.
    if (r < next.bracket.rounds.length - 1) {
      const nextRound = next.bracket.rounds[r + 1];
      const slotIdx = Math.floor(round.matches.indexOf(m) / 2);
      const nextMatch = nextRound.matches[slotIdx];
      if (!nextMatch.home) nextMatch.home = winId;
      else nextMatch.away = winId;
    } else {
      // Final done
      next.champion = winId;
      next.phase = 'done';
    }

    // Phase advance
    if (tpl.knockoutFrom === 'straight') {
      if (next.bracket.rounds[1].matches.every((x) => x.home && x.away)) next.phase = 'knockout-sf';
      if (next.bracket.rounds[2].matches.every((x) => x.home && x.away)) next.phase = 'knockout-f';
    } else if (tpl.knockoutFrom === 'group') {
      if (next.bracket.rounds[1].matches.every((x) => x.home && x.away)) next.phase = 'knockout-f';
    }
    break;
  }
  return next;
};

// Sim a non-player match by ratings.
export const simulateMatch = (homeTeam, awayTeam) => {
  const diff = (homeTeam.rating || 75) - (awayTeam.rating || 75);
  const homeLambda = Math.max(0.3, 1.3 + diff * 0.04 + (Math.random() - 0.5) * 0.4);
  const awayLambda = Math.max(0.3, 1.3 - diff * 0.04 + (Math.random() - 0.5) * 0.4);
  const poisson = (l) => {
    const L = Math.exp(-l); let k = 0, p = 1;
    while (p > L) { k++; p *= Math.random(); }
    return k - 1;
  };
  return { home: Math.min(6, poisson(homeLambda)), away: Math.min(6, poisson(awayLambda)) };
};

// Pick the next fixture the player is involved in, or null if none
// remain in the current phase.
export const nextPlayerFixture = (state) => {
  if (!state) return null;
  if (state.fixtures) {
    const f = state.fixtures.find((x) => !x.done && (x.home === state.playerTeamId || x.away === state.playerTeamId));
    if (f) return { kind:'league', fixture: f };
  }
  if (state.bracket) {
    for (const round of state.bracket.rounds) {
      const m = round.matches.find((x) => x.home === state.playerTeamId || x.away === state.playerTeamId);
      if (m && !m.score && m.home && m.away) return { kind:'knockout', fixture: m, roundName: round.name };
    }
  }
  return null;
};

export const standingsSorted = (standings) =>
  Object.entries(standings).map(([id, row]) => ({ id, ...row })).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

// Simulate all remaining non-player fixtures in the current round,
// advancing phases where possible. Returns the updated state.
export const simulateOthers = (state) => {
  let next = JSON.parse(JSON.stringify(state));

  const teamMap = Object.fromEntries(TEAMS.map((t) => [t.id, t]));
  if (next.fixtures) {
    for (const f of next.fixtures) {
      if (f.done) continue;
      if (f.home === next.playerTeamId || f.away === next.playerTeamId) continue;
      const sim = simulateMatch(teamMap[f.home], teamMap[f.away]);
      next = recordFixture(next, f.id, sim.home, sim.away);
    }
  }
  if (next.bracket) {
    for (const round of next.bracket.rounds) {
      for (const m of round.matches) {
        if (!m.home || !m.away || m.score) continue;
        if (m.home === next.playerTeamId || m.away === next.playerTeamId) continue;
        const sim = simulateMatch(teamMap[m.home], teamMap[m.away]);
        next = recordKnockout(next, m.id, sim.home, sim.away);
      }
    }
  }
  return next;
};
