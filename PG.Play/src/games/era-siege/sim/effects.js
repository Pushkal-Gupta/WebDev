// Tick screen effects (shake, flash) and particles. Damage numbers tick
// here too so all visual lifetime decay flows through one place.

export function tickEffects(state, dt) {
  const e = state.effects;
  if (e.shakeMs > 0) {
    e.shakeMs = Math.max(0, e.shakeMs - dt * 1000);
    if (e.shakeMs === 0) e.shakeMag = 0;
  }
  if (e.flashMs > 0) {
    e.flashMs = Math.max(0, e.flashMs - dt * 1000);
  }
  // Particles
  const ppool = state.pools.particle;
  for (const p of ppool.live) {
    if (!p.alive) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 600 * dt; // gravity
    p.lifeMs -= dt * 1000;
    if (p.lifeMs <= 0) p.alive = false;
  }
  ppool.sweep((p) => p.alive);

  // Damage numbers (rise + fade)
  const dpool = state.pools.damageNum;
  for (const d of dpool.live) {
    if (!d.alive) continue;
    d.ageMs += dt * 1000;
    d.y -= 28 * dt;
    if (d.ageMs >= d.lifeMs) d.alive = false;
  }
  dpool.sweep((d) => d.alive);

  // Special impact rings (visual only).
  if (state.effects.rings && state.effects.rings.length > 0) {
    for (const r of state.effects.rings) r.ageMs += dt * 1000;
    state.effects.rings = state.effects.rings.filter((r) => r.ageMs < r.lifeMs);
  }
}
