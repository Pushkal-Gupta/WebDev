// Re-export shim. The implementation lives under `src/games/arena/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './arena/index.jsx';
