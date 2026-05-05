// Re-export shim. The implementation lives under `src/games/connect4/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './connect4/index.jsx';
