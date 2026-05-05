// Re-export shim. The implementation lives under `src/games/raycaster-fps/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './raycaster-fps/index.jsx';
