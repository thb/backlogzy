import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { AuthGate, useAuth } from './components/AuthGate.tsx'
import { runMigrations } from './lib/migrations.ts'
import { startAutoSave, restoreFileHandle, loadFromFile } from './lib/file-sync.ts'

registerSW({
  onNeedRefresh() {
    window.location.reload()
  },
})

runMigrations()
startAutoSave()

// Restore file sync handle from IndexedDB (persists across reloads)
restoreFileHandle().then(async (restored) => {
  if (restored) {
    await loadFromFile()
  }
})

function Root() {
  const { authed, login } = useAuth()
  if (!authed) return <AuthGate onLogin={login} />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
