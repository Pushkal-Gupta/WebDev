// Grudgewood — Challenge Mode definitions.
//
// Each challenge takes a normal segment and overlays a rule:
//   - 'time'         : finish under {target} seconds (per medal tier)
//   - 'noDeath'      : reach the segment's final checkpoint without dying
//   - 'deathLimit'   : finish using at most {target} deaths
//   - 'noSprint'     : finish without ever pressing sprint
//   - 'hatBait'      : finish wearing a specified hat
//
// Medal thresholds: bronze < silver < gold (lower is better for time/deaths;
// "completion" suffices for boolean-mode challenges, with sub-targets for
// silver/gold).
//
// Constraints / rules attach via a small per-challenge "modifiers" object the
// gameplay loop reads each frame. Since most challenges are pure measurement,
// we mostly track end-of-run results.

export const CHALLENGES = [
  {
    id: 'mosswake-blitz',
    name: 'Mosswake Blitz',
    biome: 'mosswake',
    segment: 0,
    rule: 'time',
    target: { gold: 35, silver: 50, bronze: 75 },     // seconds
    blurb: 'Reach the checkpoint at the end of segment one. Time is the enemy.',
  },
  {
    id: 'mosswake-clean',
    name: 'Mosswake Clean Run',
    biome: 'mosswake',
    segment: 1,
    rule: 'noDeath',
    target: { gold: 0, silver: 1, bronze: 3 },        // max deaths
    blurb: 'Cross The Bend without dying. Twice for silver. Once for gold.',
  },
  {
    id: 'trickster-no-sprint',
    name: 'Trickster — Patience',
    biome: 'trickster',
    segment: 2,
    rule: 'noSprint',
    target: { gold: 60, silver: 80, bronze: 110 },    // seconds, no sprint allowed
    blurb: 'Walk only. The grove respects measured steps.',
  },
  {
    id: 'rotbog-frugal',
    name: 'Rotbog Frugal',
    biome: 'rotbog',
    segment: 4,
    rule: 'deathLimit',
    target: { gold: 1, silver: 3, bronze: 6 },
    blurb: 'Crash the bog with as few deaths as possible.',
  },
  {
    id: 'cliffside-flight',
    name: 'Cliffside Flight',
    biome: 'cliffside',
    segment: 6,
    rule: 'time',
    target: { gold: 50, silver: 70, bronze: 95 },
    blurb: 'The wind always wins eventually. Beat it before it does.',
  },
  {
    id: 'heart-bait',
    name: 'Heart in a Cone',
    biome: 'heart',
    segment: 8,
    rule: 'hatBait',
    target: { hat: 'cone-of-shame', gold: 90, silver: 120, bronze: 160 },
    blurb: 'Finish wearing the Cone of Shame. The Heart finds it personal.',
  },
];

// Decide medal from the run result.
export function gradeRun(challenge, result) {
  const { rule } = challenge;
  if (rule === 'time' || rule === 'noSprint' || rule === 'hatBait') {
    if (!result.finished) return null;
    if (result.elapsed <= challenge.target.gold) return 'gold';
    if (result.elapsed <= challenge.target.silver) return 'silver';
    if (result.elapsed <= challenge.target.bronze) return 'bronze';
    return null;
  }
  if (rule === 'deathLimit' || rule === 'noDeath') {
    if (!result.finished) return null;
    if (result.deaths <= challenge.target.gold) return 'gold';
    if (result.deaths <= challenge.target.silver) return 'silver';
    if (result.deaths <= challenge.target.bronze) return 'bronze';
    return null;
  }
  return null;
}

// Required modifier flags, read by the gameplay loop:
//   { sprintAllowed, hatRequired }
export function modifiersFor(challenge) {
  return {
    sprintAllowed: challenge.rule !== 'noSprint',
    hatRequired: challenge.rule === 'hatBait' ? challenge.target.hat : null,
    rule: challenge.rule,
  };
}

// Format the challenge target as a one-line summary for the UI.
export function targetLabel(challenge) {
  const t = challenge.target;
  switch (challenge.rule) {
    case 'time':       return `Gold ${t.gold}s · Silver ${t.silver}s · Bronze ${t.bronze}s`;
    case 'noSprint':   return `Walk-only · Gold ${t.gold}s · Silver ${t.silver}s`;
    case 'deathLimit': return `Gold ≤${t.gold} · Silver ≤${t.silver} · Bronze ≤${t.bronze} deaths`;
    case 'noDeath':    return `Gold 0 · Silver ≤${t.silver} · Bronze ≤${t.bronze} deaths`;
    case 'hatBait':    return `Wear ${t.hat} · Gold ${t.gold}s · Silver ${t.silver}s`;
    default: return '';
  }
}
