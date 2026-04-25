// Smoke import every playable game's component and assert it default-exports
// a function (React component). This catches:
//   - syntax errors / import failures
//   - missing default export
//   - components renamed/moved without registry update
//
// We don't render them — jsdom can't run Three.js + WebGL, and the game
// loops would burn CPU. Importing is enough to fail-fast on broken code.

import { describe, it, expect } from 'vitest';
import { GAMES } from '../src/data.js';

// Match the lazy-import map in src/components/GameIntro.jsx
const GAME_MODULES = {
  connect4:    () => import('../src/games/Connect4Game.jsx'),
  eightball:   () => import('../src/games/EightBallGame.jsx'),
  g2048:       () => import('../src/games/Game2048.jsx'),
  cutrope:     () => import('../src/games/CutRopeGame.jsx'),
  hook:        () => import('../src/games/SwingwireGame.jsx'),
  fps:         () => import('../src/games/RaycasterFPS.jsx'),
  grudgewood:  () => import('../src/games/GrudgewoodGame.jsx'),
  arena:       () => import('../src/games/ArenaGame.jsx'),
  slipshot:    () => import('../src/games/SlipshotGame.jsx'),
  slither:     () => import('../src/games/SlitherLiteGame.jsx'),
  basket:      () => import('../src/games/HoopShotGame.jsx'),
  aow:         () => import('../src/games/EraLaneGame.jsx'),
  bloons:      () => import('../src/games/LoftDefenseGame.jsx'),
  vex:         () => import('../src/games/TraceGame.jsx'),
  bob:         () => import('../src/games/NightShiftGame.jsx'),
  goalbound:   () => import('../src/games/GoalboundGame.jsx'),
  fbwg:        () => import('../src/games/EmberTideGame.jsx'),
  badicecream: () => import('../src/games/FrostFightGame.jsx'),
  papa:        () => import('../src/games/ShortOrderGame.jsx'),
  happywheels: () => import('../src/games/FaceplantGame.jsx'),
  bricklands:  () => import('../src/games/BricklandsGame.jsx'),
};

describe('every playable game imports cleanly', () => {
  const playable = GAMES.filter((g) => g.playable);

  for (const game of playable) {
    it(`${game.id} (${game.name})`, async () => {
      const importer = GAME_MODULES[game.id];
      expect(importer, `lazy importer registered for ${game.id}`).toBeTruthy();
      const mod = await importer();
      expect(mod.default, `${game.id} default export`).toBeTypeOf('function');
    });
  }
});
