// Projectile visual + travel-speed metadata. Damage is owned by the
// firing unit/turret (read at impact); shape lives here so renderer
// stays content-driven.

/**
 * @typedef {Object} ProjectileDef
 * @property {string} id
 * @property {'bolt'|'orb'} kind
 * @property {number} speed         px/sec
 * @property {string} colorPrimary
 * @property {string} colorTrail
 * @property {number} sizePx
 * @property {number} ttlMs
 */

export const PROJECTILES = [
  { id: 'bone-shard',     kind: 'bolt', speed: 480, colorPrimary: '#fff1d2', colorTrail: '#d36a3a', sizePx: 3, ttlMs: 1400 },
  { id: 'crossbow-bolt',  kind: 'bolt', speed: 540, colorPrimary: '#d8d4cc', colorTrail: '#7c8a98', sizePx: 3, ttlMs: 1400 },
  { id: 'steam-bolt',     kind: 'bolt', speed: 580, colorPrimary: '#ffcb6b', colorTrail: '#a26830', sizePx: 3, ttlMs: 1400 },
  { id: 'arc-bolt',       kind: 'bolt', speed: 700, colorPrimary: '#bef3ff', colorTrail: '#7be3ff', sizePx: 3, ttlMs: 1100 },
  { id: 'void-orb',       kind: 'orb',  speed: 420, colorPrimary: '#e9c8ff', colorTrail: '#5a3a8a', sizePx: 6, ttlMs: 1700 },
  { id: 'mortar-shell',   kind: 'orb',  speed: 380, colorPrimary: '#ffcb6b', colorTrail: '#7a4818', sizePx: 5, ttlMs: 1700 },
];

export const PROJECTILES_BY_ID = Object.freeze(
  PROJECTILES.reduce((acc, def) => { acc[def.id] = def; return acc; }, /** @type {Record<string, ProjectileDef>} */ ({})),
);

export function getProjectile(id) {
  return PROJECTILES_BY_ID[id] || PROJECTILES_BY_ID['bone-shard'];
}
