// GameShellContext — lightweight bridge from the host shell to the
// embedded game. Today it only carries the shared pause state so the
// shell's floating pause button and the game's internal loop can stay
// in lockstep (without a pause context the canvas keeps stepping
// while the overlay is visible, time advances under the hood, and
// players come back to a candy that has fallen off-screen).
//
// Default value is "never paused" so games not nested under a shell
// (e.g. a standalone dev harness) still render.

import { createContext, useContext } from 'react';

export const GameShellContext = createContext({ paused: false });

export function useGameShellPaused() {
  return useContext(GameShellContext).paused;
}
