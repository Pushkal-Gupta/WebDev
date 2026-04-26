// Real mount tests — every playable game is rendered into a jsdom DOM.
//
// The smoke test (games.smoke.test.js) only verifies imports + default
// export shape. That misses the failure mode that actually shows up to
// users: a useEffect that throws on first run, leaving a blank screen.
//
// Strategy:
//   1. For each playable game, render the lazy module wrapped in our real
//      ErrorBoundary inside a sized container (so games that read
//      parent.clientWidth/Height get non-zero numbers in jsdom).
//   2. Spy on console.error. If the boundary catches a throw, it logs;
//      if React surfaces a render-time error, it logs. Either way, we
//      see it.
//   3. Wait one microtask + one rAF tick so initial useEffect has
//      run (mount sync), then assert no error patterns were logged.
//
// Three.js games (slipshot, grudgewood) need a real WebGL context that
// jsdom can't provide — `getContext('webgl')` returns null and Three's
// WebGLRenderer throws "Error creating WebGL context.". Those are
// skipped with a comment; the smoke test still imports them so we
// catch syntax / wiring breakage there.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Suspense, lazy } from 'react';
import ErrorBoundary from '../src/components/ErrorBoundary.jsx';
import { GAMES } from '../src/data.js';

// Match the lazy-import map in src/components/GameIntro.jsx so this test
// stays in lock-step with what the app actually loads.
const PLAYABLE = {
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

// Games that need a real WebGL/GPU context jsdom cannot fake. Three.js
// throws inside its WebGLRenderer constructor when getContext('webgl')
// returns null. We document and skip — smoke test still covers them.
const REQUIRES_WEBGL = new Set(['slipshot', 'grudgewood']);

// Patterns that indicate a real React/runtime error (caught by the
// boundary or surfaced by React itself). If any logged console.error
// contains one of these, the test fails.
const ERROR_PATTERNS = [
  'Cannot read',
  'is not defined',
  'is not a function',
  'undefined is not',
  'null is not',
  'TypeError',
  'ReferenceError',
  'SyntaxError',
  'ErrorBoundary caught',
];

// Some logs are expected and benign in mount-only tests:
//   - React's "act()" warnings (we don't drive interactions)
//   - act-warnings about state updates from rAF callbacks
const BENIGN_PATTERNS = [
  'not wrapped in act',
  'inside a test was not wrapped in act',
];

const isBenign = (msg) => BENIGN_PATTERNS.some((p) => msg.includes(p));
const looksLikeError = (msg) => ERROR_PATTERNS.some((p) => msg.includes(p));

// Render the game inside a sized container so anything that reads
// clientWidth/Height during mount gets sane numbers — jsdom defaults to
// zero, which has tripped a couple of game effects in the past.
function renderGame(GameComp) {
  // Force a parent with non-zero offsets. jsdom doesn't lay out, so we
  // assign clientWidth/Height via a getter on the wrapper after mount.
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth',  { configurable: true, get: () => 1280 });
  Object.defineProperty(container, 'clientHeight', { configurable: true, get: () => 720 });
  document.body.appendChild(container);

  return render(
    <ErrorBoundary>
      <Suspense fallback={<div data-testid="suspense-fallback">loading</div>}>
        <GameComp/>
      </Suspense>
    </ErrorBoundary>,
    { container },
  );
}

// Yield a frame so rAF callbacks scheduled inside useEffect can run
// once. We keep it short — this is a mount test, not a soak test.
const nextFrame = () => new Promise((r) => setTimeout(r, 0));

let consoleErrorSpy;
let collected;

beforeEach(() => {
  collected = [];
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
    // Stringify each arg; React error overlay sometimes passes Error objects.
    const msg = args
      .map((a) => (a instanceof Error ? `${a.name}: ${a.message}` : String(a)))
      .join(' ');
    collected.push(msg);
  });
});

afterEach(() => {
  cleanup();
  consoleErrorSpy?.mockRestore();
  // Strip every container we created inside renderGame so DOM doesn't
  // accumulate across tests.
  document.body.innerHTML = '';
});

describe('every playable game mounts without crashing', () => {
  const playable = GAMES.filter((g) => g.playable);

  for (const game of playable) {
    if (REQUIRES_WEBGL.has(game.id)) {
      // jsdom returns null from getContext('webgl'); Three.js's
      // WebGLRenderer constructor throws synchronously. The smoke test
      // already verifies the module imports cleanly.
      it.skip(`${game.id} (${game.name}) — needs real WebGL`, () => {});
      continue;
    }

    it(`${game.id} (${game.name})`, async () => {
      const importer = PLAYABLE[game.id];
      expect(importer, `lazy importer registered for ${game.id}`).toBeTruthy();
      const mod = await importer();
      const GameComp = mod.default;
      expect(GameComp, `${game.id} default export`).toBeTypeOf('function');

      let utils;
      // The render itself must not throw. ErrorBoundary will swallow
      // child throws and log them via componentDidCatch; we read those
      // in the spy.
      expect(() => { utils = renderGame(GameComp); }).not.toThrow();

      // Let the initial useEffect (and any zero-delay rAF / setTimeout
      // continuation it queued) run.
      await nextFrame();
      await nextFrame();

      // The component (or the boundary fallback) must still be in the
      // tree — a totally-blank document.body would mean React unmounted
      // everything synchronously, which only happens on a render error
      // we failed to catch.
      expect(utils.container.firstChild, `${game.id} produced DOM`).toBeTruthy();

      // No real errors should have been logged. Benign React warnings
      // ("not wrapped in act") are filtered out so they don't make this
      // test flaky in CI.
      const realErrors = collected.filter((m) => !isBenign(m) && looksLikeError(m));
      expect(realErrors, `${game.id} threw during mount:\n${realErrors.join('\n---\n')}`)
        .toEqual([]);
    });
  }
});
