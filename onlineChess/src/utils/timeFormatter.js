/**
 * Shared time formatting utility — single source of truth for clock display.
 * All times are in MILLISECONDS throughout the app.
 */

/**
 * Format milliseconds into clock display string.
 * - Above 10 s:  "M:SS"
 * - At or below 10 s:  "S.t" (tenths)
 * @param {number} ms  Time remaining in milliseconds
 * @returns {string} e.g. "5:30", "0:05", "9.3", "0.0"
 */
export function formatTime(ms) {
  if (ms <= 0) return '0.0';
  const totalSeconds = ms / 1000;
  if (totalSeconds <= 10) {
    // Show tenths: "9.3", "4.1", "0.5"
    const s = Math.floor(totalSeconds);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${s}.${tenths}`;
  }
  // Show M:SS
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Check if time is in low-time warning zone (10 seconds).
 * @param {number} ms  Time remaining in milliseconds
 * @returns {boolean}
 */
export function isLowTime(ms) {
  return ms > 0 && ms <= 10_000;
}
