// Monotonic integer ids inside a single match. Reset on match start so
// long-running PG.Play sessions across many matches don't accumulate
// weird id space.

export function makeIdAllocator() {
  let n = 0;
  return () => ++n;
}
