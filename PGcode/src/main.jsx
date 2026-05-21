import React from 'react'
import ReactDOM from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import App from './App.jsx'
import { queryClient, persister } from './lib/queryClient.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
        // Bump when seed data changes so users with stale localStorage caches
        // refetch instead of seeing yesterday's empty arrays.
        buster: 'v3-2026-05-19-content-seed',
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </React.StrictMode>,
)
