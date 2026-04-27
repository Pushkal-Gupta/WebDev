// Era Siege — production rebuild over the original Era Lane MVP.
//
// The file path stays here so the existing lazy import in
// src/components/GameIntro.jsx and the smoke + mount tests keep working
// without changes. The implementation lives in a folder-based module
// at src/games/era-siege/ for clarity (engine, sim, content, ui, utils
// each in their own files).
//
// See docs/ERA_SIEGE_GAME_SPEC.md for the design and
// docs/ERA_SIEGE_TECH_ARCHITECTURE.md for the layout.
export { default } from './era-siege/index.jsx';
