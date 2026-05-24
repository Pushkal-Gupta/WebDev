---
slug: service-worker-pwa
module: system-design
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
Imagine a desk clerk between you and the post office. Normally, every letter you write goes straight to the post office (network). With a clerk (service worker), letters first hit the clerk's desk. The clerk can hand back a copy of a recent reply from a filing cabinet (cache), bundle outgoing letters for batch delivery when the road clears (background sync), or generate a polite "we're working on it" response when the post office is closed (offline fallback). You, the page, never know the difference.

## visualization
Trace a fetch under "cache-first, network-fallback" strategy: page calls `fetch('/data.json')`. Service worker's `fetch` event fires before the browser dispatches the network request. Handler runs `caches.match(event.request)` — hit, returns cached Response immediately (5 ms vs 200 ms). On miss, falls through to `fetch(event.request)`, awaits the response, and `cache.put` stores it for next time. Page receives the Response object identically either way — service worker is transparent.

## bruteForce
Hand-roll caching in every page via localStorage + manual fetch wrappers. Works for tiny apps but breaks on cross-page navigation (each page reload starts cold), cannot intercept images or CSS (they bypass JS fetch), and offers no background processing. To handle offline, you'd duplicate the strategy in every entry point and synchronize cache invalidation manually. Service workers solve all of this at the platform level.

## optimal
Register the service worker once on first visit. Use Workbox or hand-craft strategies per resource type: cache-first for fingerprinted static assets (hashed JS/CSS), network-first for HTML and API responses (with cache fallback), stale-while-revalidate for images and avatars. Use `skipWaiting()` + `clients.claim()` carefully — they upgrade users immediately but risk version mismatch between an open tab and a new SW. Layer in Background Sync for offline-tolerant POSTs and Web Push for re-engagement.

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
