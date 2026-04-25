import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

// Register the service worker after mount so it doesn't compete with first
// paint. Skipped on dev (no-op) and skipped if the browser doesn't support
// it. The SW does the actual offline-shell caching strategy.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/PG.Play/sw.js', { scope: '/PG.Play/' })
      .catch((err) => { console.warn('SW register failed:', err); });
  });
}
