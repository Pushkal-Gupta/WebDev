import { useEffect, useState, useCallback } from 'react';

// Recent-played tracker. Local-only — fast, no server roundtrip.
// Listens for `pgplay:open` events fired by Home.onOpen so any entry
// point that takes a player into a game lands here.
//
// Stored as an array of game ids, most-recent first, capped at LIMIT.

const KEY = 'pgplay-recent-v1';
const LIMIT = 8;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(ids) {
  try { localStorage.setItem(KEY, JSON.stringify(ids.slice(0, LIMIT))); }
  catch { /* quota; silently no-op */ }
}

export function useRecent() {
  const [recent, setRecent] = useState(read);

  useEffect(() => {
    const onOpen = (e) => {
      const gameId = e?.detail?.gameId;
      if (!gameId || typeof gameId !== 'string') return;
      setRecent((prev) => {
        const next = [gameId, ...prev.filter((x) => x !== gameId)].slice(0, LIMIT);
        write(next);
        return next;
      });
    };
    window.addEventListener('pgplay:open', onOpen);
    return () => window.removeEventListener('pgplay:open', onOpen);
  }, []);

  const clear = useCallback(() => { setRecent([]); write([]); }, []);

  return { recent, clear };
}
