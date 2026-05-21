import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '',
  plugins: [react()],
  build: {
    // Hand-split vendor chunks so the main entry isn't ~540KB. Each chunk has
    // a long-lived cache key because user code edits don't bump these hashes.
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-monaco':   ['@monaco-editor/react'],
          'vendor-reactflow':['reactflow'],
          'vendor-query':    ['@tanstack/react-query', '@tanstack/query-sync-storage-persister', '@tanstack/react-query-persist-client'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-icons':    ['lucide-react'],
        },
      },
    },
    // Bump the warning threshold so the build stops scolding us about the
    // remaining main chunk (which still holds React Router + shared lib code).
    chunkSizeWarningLimit: 700,
  },
})
