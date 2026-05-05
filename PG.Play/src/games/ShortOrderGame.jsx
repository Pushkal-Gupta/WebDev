// Re-export shim. The implementation lives under `src/games/short-order/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './short-order/index.jsx';
