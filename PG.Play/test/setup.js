import '@testing-library/jest-dom/vitest';

// jsdom is missing a few APIs games reach for; stub them so mounts don't crash.
if (!HTMLCanvasElement.prototype.getContext) {
  HTMLCanvasElement.prototype.getContext = () => null;
}

// Mock IntersectionObserver / ResizeObserver — not used by smoke tests but
// some imports check for them.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver ??= NoopObserver;
globalThis.ResizeObserver ??= NoopObserver;

// Match-media stub for prefers-reduced-motion checks during import.
if (!globalThis.matchMedia) {
  globalThis.matchMedia = () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  });
}

// import.meta.env shim for src/supabase.js (which throws if missing).
import.meta.env.VITE_SUPABASE_URL = 'http://localhost:0';
import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
