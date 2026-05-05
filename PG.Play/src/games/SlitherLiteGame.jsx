// Re-export shim. The implementation lives under `src/games/slither-lite/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './slither-lite/index.jsx';
