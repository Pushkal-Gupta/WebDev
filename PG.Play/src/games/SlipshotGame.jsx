// Re-export shim. The implementation lives under `src/games/slipshot/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './slipshot/index.jsx';
