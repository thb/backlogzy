import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthGate, useAuth } from './components/AuthGate.tsx'
import { runMigrations } from './lib/migrations.ts'
import { startAutoSave } from './lib/file-sync.ts'

runMigrations()
startAutoSave()

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
