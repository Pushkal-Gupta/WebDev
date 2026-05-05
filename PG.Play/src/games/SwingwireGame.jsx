// Re-export shim. The implementation lives under `src/games/swingwire/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './swingwire/index.jsx';
