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
  // Phase 18: smaller, denser sparkle that fires at every newly-placed
  // ice tile. Designed to be cheap (4 particles) so a 12-tile row cast
  // doesn't tank the frame.
  iceForm: {
    count: 4,
    speed: 14,
    speedJitter: 6,
    life: 0.32,
    sizeBase: 1.0,
    sizeJitter: 0.6,
    colors: ['#ffffff', '#bfe7ff', '#6cd0f0'],
  },
  // Phase 18: 6 cyan shards outward when an ice tile melts.
  iceShatter: {
    count: 6,
    speed: 32,
    speedJitter: 10,
    life: 0.40,
    sizeBase: 1.4,
    sizeJitter: 0.6,
    colors: ['#bfe7ff', '#ffffff', '#6cd0f0'],
  },
  // Phase 18: small dust puff under an eggplant-stomp wall crack.
  wallCrack: {
    count: 7,
    speed: 16,
    speedJitter: 6,
    life: 0.42,
    sizeBase: 1.5,
    sizeJitter: 0.7,
    colors: ['#cbb798', '#a08866', '#ffffff'],
  },
  // Phase 18: teal flash burst when a plum bot teleports — fires at
  // both source + destination tiles.
  teleport: {
    count: 10,
    speed: 28,
    speedJitter: 8,
    life: 0.45,
    sizeBase: 1.4,
    sizeJitter: 0.7,
    colors: ['#a8f0d8', '#6cd0f0', '#ffffff'],
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
    } else if (p.ring) {
      // Stroked expanding ring. Radius interpolates from `size` (r0)
      // up to `r1` over the particle's lifetime.
      const t = 1 - p.life / p.max;
      const r = p.size + (p.r1 - p.size) * t;
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.width;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, TAU);
      ctx.stroke();
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

// Phase 18 — expanding ring used for cast windup tells (orange's
// thought bubble), fuse counters, and other 'something is about to
// happen here' beats. Drawn as a stroked arc; radius grows from
// `r0` to `r1` over `life` seconds, alpha fades from 1 to 0.
export function spawnRing(list, cx, cy, opts = {}) {
  const life = opts.life ?? 0.4;
  list.push({
    ring: true,
    x: cx,
    y: cy,
    vx: 0, vy: 0,
    life,
    max: life,
    color: opts.color ?? '#bfe7ff',
    size: opts.r0 ?? 2,
    r1: opts.r1 ?? 18,
    width: opts.width ?? 2,
  });
}
