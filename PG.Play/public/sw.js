// PG.Play service worker — minimal offline shell.
//
// Strategy:
//   - Static assets (JS, CSS, fonts, images): stale-while-revalidate.
//     The user gets cached bytes instantly; a fresh copy lands in the
//     cache for next time.
//   - HTML / navigation requests: network-first with cache fallback so
//     a fresh build is picked up immediately, but a flaky network still
//     paints the last good shell.
//   - Supabase / edge function requests: never cache (always live).
//
// Cache name is versioned. Bump VERSION when shipping a release that
// changes the static asset shape; the activate step purges old caches.

// Bump VERSION on every release that changes static asset shapes.
// Old caches are purged in the activate step, so stale chunks can't
// stick around and serve a half-broken SPA after a deploy.
const VERSION = 'pgplay-v3-2026-04-27-1';
const CORE = [
  '/PG.Play/',
  '/PG.Play/index.html',
  '/PG.Play/favicon.svg',
  '/PG.Play/og.svg',
  '/PG.Play/site.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(CORE)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache live API.
  if (url.hostname.endsWith('.supabase.co')) return;
  // Same-origin only.
  if (url.origin !== self.location.origin) return;

  // Navigation: network-first, fall back to cached shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match('/PG.Play/'))),
    );
    return;
  }

  // Static asset: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});
