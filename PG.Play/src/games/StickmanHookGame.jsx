// Re-export shim. The implementation lives under `src/games/stickman-hook/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './stickman-hook/index.jsx';
