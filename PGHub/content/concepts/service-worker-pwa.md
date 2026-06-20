---
slug: service-worker-pwa
module: sd-caching-cdn
title: Service Workers and PWAs
subtitle: Background scripts that intercept fetch — the engine behind offline-capable web apps.
difficulty: Intermediate
position: 46
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Service Workers — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/service-workers-in-javascript/"
    type: blog
  - title: "OSTEP — Distributed Systems"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/dist-intro.pdf"
    type: book
  - title: "nginx — caching reference"
    url: "https://github.com/nginx/nginx"
    type: repo
status: published
---

## intro
A service worker is a JavaScript file the browser runs in a background thread, independent of any page. Once registered, it can intercept every `fetch` made by pages on its scope — letting it serve responses from a local cache, queue failed requests for retry, or generate responses synthetically. This is the technical foundation of Progressive Web Apps (PWAs): installable, offline-capable, push-notification-enabled web apps that match native-app reliability.

## whyItMatters
Service workers are the only API that lets a web app behave correctly on a flaky or offline network. Twitter Lite, Starbucks, Pinterest, and countless news sites use them to drop 50% of network traffic and survive subway tunnels. Interviewers ask because the model — a proxy you ship to the client that intercepts every request — is genuinely subtle: lifecycle events, scope rules, cache eviction, update strategies. Getting it wrong silently breaks users for days because old service workers keep serving stale code.

## intuition
A service worker is a **JavaScript file the browser runs in a background thread**, independent of any page. Once registered, it can intercept every `fetch` made by pages on its scope — letting it serve responses from a local cache, queue failed requests for retry, or generate responses synthetically. This is the technical foundation of **Progressive Web Apps (PWAs)**: installable, offline-capable, push-notification-enabled web apps that approach native-app reliability.

The mental model is **a programmable proxy you ship to the client**. Before service workers, every fetch from a page went directly to the network — cached only by the HTTP layer's opaque rules (Cache-Control, ETag). With a service worker registered, every fetch first hits **the SW's `fetch` event handler**, which gets full access to the request and the response, plus a programmable Cache API (`caches.open(name).put(req, res)`, `caches.match(req)`). The SW can return a cached Response immediately (5 ms vs 200 ms network round-trip), fall through to `fetch(event.request)` and cache the result, or synthesize a Response from IndexedDB or hard-coded fallbacks.

The clerk analogy: every letter normally goes straight to the post office (network). With a clerk between you and the post office, letters first hit the clerk's desk. The clerk can hand back a copy of a recent reply from a filing cabinet (cache), bundle outgoing letters for batch delivery when the road clears (Background Sync), or generate a polite "we're working on it" response when the post office is closed (offline fallback). The page never knows the difference — the Response object it receives is identical whether it came from cache, network, or a generated synthetic.

The model is genuinely subtle. The SW runs in a **separate thread with no DOM access** and can be **killed at any time when idle** — never store state in module-level variables expecting persistence; use IndexedDB or the Cache API. The **lifecycle** is `install -> waiting -> activating -> activated`, and the old SW remains the controller until every tab using it closes (which is why `skipWaiting()` and `clients.claim()` exist as opt-in upgrade accelerators). The **scope** of an SW is its directory and subdirectories — an SW at `/app/sw.js` controls only `/app/*`, so most teams place sw.js at root with the `Service-Worker-Allowed: /` header. Getting any of this wrong silently breaks users for days because old SWs keep serving stale code.

## visualization
Trace a fetch under "cache-first, network-fallback" strategy: page calls `fetch('/data.json')`. Service worker's `fetch` event fires before the browser dispatches the network request. Handler runs `caches.match(event.request)` — hit, returns cached Response immediately (5 ms vs 200 ms). On miss, falls through to `fetch(event.request)`, awaits the response, and `cache.put` stores it for next time. Page receives the Response object identically either way — service worker is transparent.

## bruteForce
Hand-roll caching in every page via localStorage + manual fetch wrappers. Works for tiny apps but breaks on cross-page navigation (each page reload starts cold), cannot intercept images or CSS (they bypass JS fetch), and offers no background processing. To handle offline, you'd duplicate the strategy in every entry point and synchronize cache invalidation manually. Service workers solve all of this at the platform level.

## optimal
The right architecture is **per-resource caching strategy, versioned cache names, careful lifecycle control, and Workbox for non-trivial logic**. The Google Workers documentation, Jake Archibald's "The offline cookbook" (2014), and the W3C Service Workers spec define the canonical patterns; Workbox (Google) ships them as composable strategies.

```javascript
// sw.js — production-grade service worker with per-resource strategies.
const VERSION = 'v3-2024-05';
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const STATIC_ASSETS = ['/', '/app.js', '/styles.css', '/offline.html'];

// 1. INSTALL: precache the app shell.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // self.skipWaiting();  // OPTIONAL: enable only with a user-prompted upgrade UX.
});

// 2. ACTIVATE: clean up old cache versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 3. FETCH: per-resource strategy.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy A: cache-first for fingerprinted static assets.
  if (url.pathname.match(/\.[a-f0-9]{8,}\.(js|css|woff2)$/)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // Strategy B: network-first for navigation (HTML), with offline fallback.
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, RUNTIME_CACHE)
      .catch(() => caches.match('/offline.html')));
    return;
  }

  // Strategy C: stale-while-revalidate for images, avatars.
  if (event.request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(event.request, RUNTIME_CACHE));
    return;
  }
});

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  return cached || fetch(req).then((res) => {
    if (res.ok) caches.open(cacheName).then((c) => c.put(req, res.clone()));
    return res;
  });
}

async function networkFirst(req, cacheName) {
  try {
    const fresh = await fetch(req);
    caches.open(cacheName).then((c) => c.put(req, fresh.clone()));
    return fresh;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    throw new Error('offline and not cached');
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cached = await caches.match(req);
  const fetchPromise = fetch(req).then((res) => {
    caches.open(cacheName).then((c) => c.put(req, res.clone()));
    return res;
  });
  return cached || fetchPromise;
}
```

Why this is right: the three strategies map to the three resource classes correctly. **Fingerprinted assets** (Webpack/Vite-generated `app.abc123.js`) never change content under their URL, so cache-first with permanent retention is safe — cache hits are free, no revalidation needed. **HTML / navigation requests** must serve fresh content when online (network-first), with an offline fallback page so users see something useful when disconnected. **Images** tolerate staleness for instant rendering plus background refresh (stale-while-revalidate); the next visit shows the updated image.

**Versioned cache names** (`static-v3-2024-05`) plus the `activate` cleanup hook prevent the "stuck on old build" trap. Without versioning, an old cached `index.html` could pin users to a code version that no longer matches your backend's API.

**Production tooling**:
- **Workbox** (Google's library, shipped with Vite PWA plugin, Next.js PWA, Create React App): provides `precacheAndRoute`, `registerRoute`, and pre-built strategies; handles the boilerplate you would otherwise write 50 lines of per project.
- **Background Sync API**: queue failed POST/PUT requests when offline, retry when the network returns. Use for likes, comments, "save draft" — anywhere user intent must survive a tunnel.
- **Web Push API + Notification API**: re-engagement notifications even when the page is closed; requires server-side VAPID keys and a push service (Firebase Cloud Messaging, Apple Push).
- **Periodic Background Sync** (Chromium): wakes the SW on a schedule to refresh content; great for news apps.

**Critical anti-patterns**:
- **Caching `/index.html` with cache-first**: users get permanently stuck on an old build. Always use network-first for navigation requests.
- **`skipWaiting()` without a UX prompt**: silently reloads the user mid-action (lost form state); pair with a "new version available, click to update" UI toast.
- **Caching opaque cross-origin responses (status 0)**: they take full space in the cache quota and you cannot inspect them — set a max size limit.
- **Wrong scope**: a SW at `/app/sw.js` controls only `/app/*`; most teams place sw.js at root with `Service-Worker-Allowed: /` header.
- **Storing state in SW module-level variables**: the runtime can kill the SW when idle; persistent state belongs in IndexedDB or the Cache API.

**Lifecycle to remember**: `install -> waiting -> activating -> activated -> fetch events`. Old SW remains controller until every tab using it closes — that is why versioning matters and why `clients.claim()` is sometimes needed to take over mid-session.

## complexity
time: cache hit ~ 5-20 ms (no network); network round-trip ~ 50-500 ms
space: per-origin Cache Storage quota typically ~ 60% of available disk; eviction is LRU when full
notes: Service workers run in a separate thread with no DOM access. They can be killed at any time when idle — never store state in module-level variables expecting persistence; use IndexedDB or the Cache API.

## pitfalls
- Caching the `index.html` shell forever — users get permanently stuck on an old build. Always use network-first for navigation requests or version the shell.
- Forgetting that `skipWaiting()` triggers an immediate page reload mid-session — combine with a "new version available" UI prompt for graceful upgrades.
- Scope confusion: a service worker at `/app/sw.js` controls only `/app/*`, not the whole origin. Most teams place sw.js at root.
- Caching opaque cross-origin responses (status 0) — they take full space in cache quota and you cannot inspect them.

## interviewTips
- Distinguish three strategies clearly: cache-first (static assets), network-first (HTML), stale-while-revalidate (images). Pick the right one per resource.
- Mention the SW lifecycle: install → waiting → activating → activated. Users on old tabs stay on old SW until they close every tab.
- Bring up Background Sync and Web Push as the "PWA differentiators" — they extend SW capability beyond simple caching.
- If asked about debugging, mention Chrome DevTools → Application → Service Workers, and the "Update on reload" toggle for development.

## code.python
```python
def build_sw_js(precache: list[str]) -> str:
    return f"""
const CACHE = 'v1';
const PRECACHE = {precache!r};
self.addEventListener('install', (e) => {{
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
}});
self.addEventListener('fetch', (e) => {{
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
}});
"""

print(build_sw_js(['/', '/app.js', '/styles.css']))
```

## code.javascript
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// sw.js
const CACHE = 'v1';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/app.js', '/styles.css'])));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fresh = fetch(e.request).then((res) => {
        caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      });
      return cached || fresh;
    })
  );
});
```

## code.java
```java
public class ServiceWorkerHeaders {
    public static java.util.Map<String, String> swHeaders() {
        var h = new java.util.HashMap<String, String>();
        h.put("Content-Type", "application/javascript");
        h.put("Service-Worker-Allowed", "/");
        h.put("Cache-Control", "no-cache, max-age=0");
        return h;
    }
}
```

## code.cpp
```cpp
#include <string>
#include <vector>
#include <sstream>

std::string buildServiceWorker(const std::vector<std::string>& precache) {
    std::ostringstream out;
    out << "const CACHE='v1';const PRE=[";
    for (size_t i = 0; i < precache.size(); ++i) {
        out << "'" << precache[i] << "'" << (i + 1 < precache.size() ? "," : "");
    }
    out << "];self.addEventListener('install',e=>e.waitUntil("
        << "caches.open(CACHE).then(c=>c.addAll(PRE))));";
    return out.str();
}
```
