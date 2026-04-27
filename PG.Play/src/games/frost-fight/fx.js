// Frost Fight — lightweight canvas particle FX layer.
//
// One tiny module so the main loop just calls `spawnFx`, `tickFx`,
// `drawFx`. Each particle is a flat object; we keep them in a plain
// array so the loop stays GC-friendly.
//
// Kinds
//   'fruit'  — bright red+white burst on pickup
//   'freeze' — cyan crystal dust on a freeze
//   'melt'   — pink-rose dust on an ice melt
//   'death'  — fast red ring on a touched-by-enemy event
//
// Each particle: { x, y, vx, vy, life, max, color, size }
//   - x/y are in board coordinates (the loop draws inside the same
//     scaled coordinate system as the playfield).
//   - life decays each tick from `max` to 0; alpha = life/max.

const PRESETS = {
  fruit: {
    count: 10,
    speed: 32,
    speedJitter: 12,
    life: 0.50,
    sizeBase: 1.6,
    sizeJitter: 1.0,
    colors: ['#ff4d6d', '#ff8e9f', '#ffffff'],
  },
  freeze: {
    count: 12,
    speed: 22,
    speedJitter: 10,
    life: 0.55,
    sizeBase: 1.2,
    sizeJitter: 0.8,
    colors: ['#bfe7ff', '#ffffff', '#6cd0f0'],
  },
  melt: {
    count: 9,
    speed: 18,
    speedJitter: 8,
    life: 0.45,
    sizeBase: 1.1,
    sizeJitter: 0.7,
    colors: ['#ff8aa3', '#ffffff', '#ff4d6d'],
  },
  death: {
    count: 14,
    speed: 46,
    speedJitter: 14,
    life: 0.40,
    sizeBase: 1.8,
    sizeJitter: 0.9,
    colors: ['#ff4d6d', '#ff7b96', '#ffffff'],
  },
};

const TAU = Math.PI * 2;

export function spawnFx(list, kind, cx, cy) {
  const p = PRESETS[kind] || PRESETS.fruit;
  for (let i = 0; i < p.count; i++) {
    const angle = (i / p.count) * TAU + Math.random() * 0.4;
    const speed = p.speed + (Math.random() * 2 - 1) * p.speedJitter;
    const life = p.life * (0.85 + Math.random() * 0.3);
    list.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      max: life,
      color: p.colors[(Math.random() * p.colors.length) | 0],
      size: p.sizeBase + Math.random() * p.sizeJitter,
    });
  }
}

export function tickFx(list, dt) {
  // Single in-place compaction: advance, decay, drop dead. Avoids a
  // second pass that'd reallocate the array each frame.
  let w = 0;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    p.life -= dt;
    if (p.life <= 0) continue;
    // Cheap drag: 88% per second of speed retained.
    const drag = Math.exp(-1.4 * dt);
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    list[w++] = p;
  }
  list.length = w;
}

export function drawFx(list, ctx) {
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const alpha = Math.max(0, Math.min(1, p.life / p.max));
    if (p.text) {
      // Text floater. Drawn in board coordinates; the surrounding scale
      // transform takes care of screen size. Font weight matches the
      // chip vocabulary used in the HUD.
      ctx.globalAlpha = alpha;
      ctx.font = `700 ${p.size}px "Bricolage Grotesque", "Inter", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Soft shadow for readability over busy floor tiles.
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillText(p.text, p.x + 0.6, p.y + 0.6);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// Text floater — small label that drifts up and fades. Used for "+1"
// pickups, "OUCH!" on death, etc. Plain object pushed into the same
// list as particles; tick + draw branch on the `text` field.
export function spawnFloater(list, text, cx, cy, color = '#ffffff', opts = {}) {
  const life = opts.life ?? 0.9;
  list.push({
    text,
    x: cx,
    y: cy,
    vx: 0,
    vy: opts.vy ?? -22,
    life,
    max: life,
    color,
    size: opts.size ?? 11,
  });
}
