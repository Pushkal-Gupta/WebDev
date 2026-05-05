// Re-export shim. The implementation lives under `src/games/game-2048/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './game-2048/index.jsx';
