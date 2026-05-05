// Re-export shim. The implementation lives under `src/games/eight-ball/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './eight-ball/index.jsx';
