// Tiny theme hook — single source of truth across App and Home.
// Stores in localStorage as 'pd-theme', mirrors to document.documentElement
// data-theme so CSS picks it up. Cross-tab safe via the storage event.

import { useEffect, useState } from 'react';

const KEY = 'pd-theme';
const apply = (t) => document.documentElement.setAttribute('data-theme', t);

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem(KEY) || 'dark';
  });

  useEffect(() => {
    apply(theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  // Cross-tab sync: another tab toggled? Pick it up.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY && e.newValue && e.newValue !== theme) setTheme(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [theme]);

  return [theme, setTheme];
}
