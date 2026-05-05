// Re-export shim. The implementation lives under `src/games/faceplant/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './faceplant/index.jsx';
