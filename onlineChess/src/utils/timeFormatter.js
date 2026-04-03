/**
 * Shared time formatting utility — single source of truth for clock display.
 * Used by PlayerPanel, P2PGame, Timer, and any other timer display.
 */

/**
 * Format seconds into M:SS display string.
 * @param {number} seconds
 * @returns {string} e.g. "5:30", "0:05", "0:00"
 */
export function formatTime(seconds) {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Check if time is in low-time warning zone.
 * @param {number} seconds
 * @returns {boolean}
 */
export function isLowTime(seconds) {
  return seconds > 0 && seconds <= 30;
}
