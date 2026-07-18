// friendlyError is an alias of the canonical sanitizeError (src/lib/sanitizeError.js) so
// there is a single sanitisation implementation. Prefer importing sanitizeError directly;
// this alias exists because parts of PGBattle were written against friendlyError.
export { sanitizeError as friendlyError, sanitizeError } from './sanitizeError';
