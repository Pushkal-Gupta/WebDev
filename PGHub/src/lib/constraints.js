// Constraints in the catalog arrive either as an array (one string per constraint)
// or as a single blob string with every constraint jammed together — sometimes on
// separate lines, sometimes all on one line (e.g. "2 <= n <= 1000 1 <= a[i] <= 1000").
// These normalize to one entry per constraint so each renders on its own line instead
// of being sliced/jammed against its box (a recurring UI bug).

export function splitConstraintBlob(str) {
  const s = String(str || '').trim();
  if (!s) return [];
  let parts = s.split(/\r?\n|;|·|•/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) {
    // One blob with multiple constraints — split before each new comparison-chain
    // start (a number, optionally negative, immediately followed by "<="): "1 <=", "-10^4 <=".
    parts = parts[0].split(/(?=(?:^|\s)-?\d[\d^]*\s*<=)/).map((p) => p.trim()).filter(Boolean);
  }
  return parts;
}

export function toConstraintList(raw) {
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);
  return splitConstraintBlob(raw);
}
