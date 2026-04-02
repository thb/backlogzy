import { useState } from "react"

const HASH = import.meta.env.VITE_AUTH_HASH ?? ""
const SESSION_KEY = "backlogzy-auth"

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  )
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function useAuth() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  )

  async function login(password: string): Promise<boolean> {
    const hash = await sha256(password)
    if (hash === HASH) {
      sessionStorage.setItem(SESSION_KEY, "1")
      setAuthed(true)
      return true
    }
    return false
  }

  return { authed, login }
}

export function AuthGate({
  onLogin,
}: {
  onLogin: (password: string) => Promise<boolean>
}) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const ok = await onLogin(password)
    setLoading(false)
    if (!ok) {
      setError(true)
      setPassword("")
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-72"
      >
        <h1 className="text-sm font-semibold text-gray-900 mb-4">Backlogzy</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-gray-400 mb-3"
        />
        {error && (
          <p className="text-xs text-red-500 mb-2">Wrong password</p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-gray-900 text-white text-sm rounded px-3 py-2 hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "..." : "Enter"}
        </button>
      </form>
    </div>
  )
}
