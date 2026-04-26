import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

// Service-worker reset, then register fresh. The previous SW shipped with
// scope `/PG.Play/`, but the actual deploy URL is `/PG.Play/dist/`. That
// mismatch left users with a stale SW from an older path holding broken
// chunk references — the white-screen-on-load symptom. We unregister
// every SW under the current origin and clear caches before registering
// the new one with a relative path so it always matches whatever subpath
// the build is hosted at.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      // Unregister anything that doesn't match the current scope. This
      // unblocks users stuck on a stale build from a previous deploy.
      const here = new URL('./', window.location.href).href;
      for (const reg of regs) {
        if (!reg.active || !reg.active.scriptURL.startsWith(here)) {
          try { await reg.unregister(); } catch {}
        }
      }
      // Purge any cache entries that don't match our current version.
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const k of keys) {
          if (!k.startsWith('pgplay-v3-')) {
            try { await caches.delete(k); } catch {}
          }
        }
      }
      // Register with a relative path + scope so the SW lives wherever
      // the app is deployed. No more hard-coded `/PG.Play/` baked in.
      await navigator.serviceWorker.register('./sw.js', { scope: './' });
    } catch (err) {
      console.warn('[PG.Play] SW reset/register failed:', err);
    }
  });
}
