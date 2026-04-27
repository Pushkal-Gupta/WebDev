# Era Siege — Performance Budget

## Targets
| Metric | Target |
|---|---|
| First playable (lobby → first sim tick) | < 3.0 s on broadband |
| Initial chunk size (gz) | < 35 KB |
| Frame budget (desktop) | 16.67 ms (60 FPS) |
| Frame budget (modern mobile) | 33 ms (30 FPS minimum, 60 FPS goal) |
| Sustained frame time variance | p99 < 24 ms desktop |
| Memory growth after 20 minutes | < 8 MB net |
| GC pauses > 50 ms | 0 over a 5-minute match |

## Techniques in v1
1. **Fixed-step sim** with capped accumulator (`dt = 1/60`, max 4
   steps/frame) — avoids spiral-of-death after a long stall.
2. **Object pools** for projectiles + particles + damage numbers.
   Allocations in the hot path are zero.
3. **No atlases** in v1 (pure primitives) — no texture upload, no GPU
   handshake, no atlas seek.
4. **Pre-computed gradients** per era — created once at era-up, not per
   frame.
5. **HUD writes batched** per RAF frame with shallow-equal guards. The
   React render only runs when a tracked field actually changed.
6. **Damage numbers cap** at 24 simultaneous; older entries recycle.
7. **Auto-low-effects** detector watches frame time. If rolling avg >
   22ms over 3 s on mobile, particles + damage numbers are halved.
8. **Off-screen units skipped** for hit-test work that doesn't matter.
9. **Lazy load** the entire `era-siege/` chunk (Vite's manualChunks
   config does this automatically via the existing
   `lazy(() => import('../games/EraLaneGame.jsx'))` path).

## Bundle accounting (target)
| Region | Target |
|---|---|
| sim/ (engine + sim + utils) | ~14 KB gz |
| content/ (eras+units+turrets+specials+balance+difficulty) | ~6 KB gz |
| ui/ (React HUD components) | ~10 KB gz |
| renderer.js (canvas draw passes) | ~5 KB gz |
| Total | ~35 KB gz |

## Frame breakdown (desktop, era 3, 18 units in-flight)
- Input poll: <0.1 ms
- Sim tick (1 step): ~0.6 ms
- Render: ~3.0 ms (10 sky+mountain, 10 ground+bases, 10 turrets, 30 units, 10 projectiles, 10 fx)
- React HUD reconcile: ~0.5 ms
- Total: ~4.2 ms — well under 16.67 ms

## Mobile note
- DPR capped at 2 by `sizeCanvasFluid`.
- Particles capped at 24 in low-effects mode.
- Damage numbers capped at 8 in low-effects mode.
- Background mid-layer skipped if rolling p95 frame > 24ms over 5s.

## Watchpoints (regressions to monitor)
- Adding a new entity kind without pooling.
- Calling `ctx.createLinearGradient` in the per-frame path.
- React state updates inside the sim tick.
- Adding a vendor dependency.

## Profiling
- Chrome DevTools Performance tab against a 3-minute match
  (record + analyze).
- A `?perf` URL flag enables an FPS overlay (top-right) in dev only.
- The telemetry `era_siege:fps_bucket` event captures avg + p99 in
  production for any future opt-in analytics.
