// Re-export shim. The implementation lives under `src/games/night-shift/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './night-shift/index.jsx';
