import { useState } from "react"
import {
  isFileApiSupported,
  isFileConnected,
  connectFile,
  createFile,
  disconnectFile,
  loadFromFile,
} from "../lib/file-sync"

export function FileSyncButton() {
  const [connected, setConnected] = useState(isFileConnected)
  const [showMenu, setShowMenu] = useState(false)
  const supported = isFileApiSupported()

  if (!supported) return null

  async function handleOpen() {
    const ok = await connectFile()
    if (ok) {
      const loaded = await loadFromFile()
      setConnected(true)
      setShowMenu(false)
      if (loaded) window.location.reload()
    }
  }

  async function handleCreate() {
    const ok = await createFile()
    if (ok) {
      setConnected(true)
      setShowMenu(false)
    }
  }

  function handleDisconnect() {
    disconnectFile()
    setConnected(false)
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`text-xs cursor-pointer flex items-center gap-1 ${
          connected
            ? "text-green-500 hover:text-green-600"
            : "text-gray-400 hover:text-gray-600"
        }`}
        title={connected ? "File synced" : "Sync to local file"}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 8a6 6 0 0 1 12 0" />
          <path d="M14 8a6 6 0 0 1-12 0" />
          {connected && <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />}
        </svg>
        {connected ? "Synced" : "File"}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-56 py-1">
            {connected ? (
              <>
                <div className="px-3 py-2 text-xs text-green-600 border-b border-gray-100">
                  ✓ Connected to local file
                </div>
                <button
                  onClick={handleOpen}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer text-gray-700"
                >
                  Switch file...
                </button>
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer text-gray-700"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                  Sync data to a local JSON file
                </div>
                <button
                  onClick={handleOpen}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer text-gray-700"
                >
                  Open existing file...
                </button>
                <button
                  onClick={handleCreate}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer text-gray-700"
                >
                  Create new file...
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
