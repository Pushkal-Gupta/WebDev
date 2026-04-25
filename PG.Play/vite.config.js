/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Manual chunk strategy: keep the main bundle small. Heavy deps that
// aren't needed for first paint (motion, supabase, three) live in their
// own chunks so the initial download is just React + the lobby shell.
//
// Three.js was already chunking on its own (lazy r3f import). framer-motion
// and supabase-js were getting bundled into the main index chunk; carve
// them out so they're only fetched when the parts of the app that use
// them are visited (motion is everywhere on home, supabase only when
// auth/leaderboard fires).
export default defineConfig({
  base: '',
  plugins: [react()],
  server: { port: 5180, open: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.{js,jsx}'],
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('@supabase/supabase-js')) return 'supabase';
          if (id.includes('react-router')) return 'router';
          // three / r3f already split via dynamic import.
          return undefined;
        },
      },
    },
  },
});
