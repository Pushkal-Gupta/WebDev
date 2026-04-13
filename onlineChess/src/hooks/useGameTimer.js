import { useEffect } from 'react';
import useGameStore from '../store/gameStore';

/**
 * High-frequency game timer (100ms ticks with performance.now() delta).
 * Extracted from App.jsx to reduce god-component complexity.
 */
export default function useGameTimer() {
  const timerRunning = useGameStore(s => s.timerRunning);

  useEffect(() => {
    if (!timerRunning) return;
    let lastTick = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const delta = Math.round(now - lastTick);
      lastTick = now;
      useGameStore.getState().tickTimer(delta);
    }, 100);
    return () => clearInterval(id);
  }, [timerRunning]);
}
