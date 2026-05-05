// Re-export shim. The implementation lives under `src/games/bricklands/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './bricklands/index.jsx';
