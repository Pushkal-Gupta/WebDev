// Re-export shim. The implementation lives under `src/games/frost-fight/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './frost-fight/index.jsx';
