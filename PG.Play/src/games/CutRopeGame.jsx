// Re-export shim so the platform's lazy-import points and tests keep
// pointing at this stable filename. The implementation lives under
// `src/games/cut-rope/` (mirrors the grudgewood / era-siege module shape).

export { default } from './cut-rope/index.jsx';
