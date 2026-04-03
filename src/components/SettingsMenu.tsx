import { useState, useRef, useEffect } from "react"
import {
  isFileApiSupported,
  isFileConnected,
  getFileName,
  connectFile,
  createFile,
  disconnectFile,
  loadFromFile,
} from "../lib/file-sync"
import { exportData } from "../lib/backup"

type Props = {
  onImportClick: () => void
}

export function SettingsMenu({ onImportClick }: Props) {
  const [open, setOpen] = useState(false)
  const [fileConnected, setFileConnected] = useState(isFileConnected)
  const fileSupported = isFileApiSupported()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  async function handleFileOpen() {
    const ok = await connectFile()
    if (ok) {
      const loaded = await loadFromFile()
      setFileConnected(true)
      setOpen(false)
      if (loaded) window.location.reload()
    }
  }

  async function handleFileCreate() {
    const ok = await createFile()
    if (ok) {
      setFileConnected(true)
      setOpen(false)
    }
  }

  async function handleFileDisconnect() {
    await disconnectFile()
    setFileConnected(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded hover:bg-gray-100"
        title="Settings"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="2.5" />
          <path d="M6.7 1.6h2.6l.3 1.7a5 5 0 0 1 1.2.7l1.6-.6 1.3 2.2-1.3 1.1a5 5 0 0 1 0 1.4l1.3 1.1-1.3 2.2-1.6-.6a5 5 0 0 1-1.2.7l-.3 1.7H6.7l-.3-1.7a5 5 0 0 1-1.2-.7l-1.6.6-1.3-2.2 1.3-1.1a5 5 0 0 1 0-1.4L2.3 5.6l1.3-2.2 1.6.6a5 5 0 0 1 1.2-.7l.3-1.7Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-52 py-1">
          {/* Export */}
          <button
            onClick={() => {
              exportData()
              setOpen(false)
            }}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer text-gray-700 flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2v8M5 7l3 3 3-3M3 12h10" />
            </svg>
            Export backup
          </button>

          {/* Import */}
          <button
            onClick={() => {
              onImportClick()
              setOpen(false)
            }}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer text-gray-700 flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 10V2M5 5l3-3 3 3M3 12h10" />
            </svg>
            Import backup
          </button>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1" />

          {/* File sync section */}
          {fileSupported ? (
            fileConnected ? (
              <>
                <div className="px-3 py-1.5 text-xs text-green-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  File sync active
                </div>
                {getFileName() && (
                  <div className="px-3 pb-1 text-[10px] text-gray-400 truncate">
                    {getFileName()}
                  </div>
                )}
                <button
                  onClick={handleFileOpen}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer text-gray-700"
                >
                  Switch file...
                </button>
                <button
                  onClick={handleFileDisconnect}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer text-gray-700"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleFileOpen}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer text-gray-700 flex items-center gap-2"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 13V5a1 1 0 0 1 1-1h3l2 2h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z" />
                  </svg>
                  Open sync file...
                </button>
                <button
                  onClick={handleFileCreate}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer text-gray-700 flex items-center gap-2"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 4v8M4 8h8" />
                  </svg>
                  Create sync file...
                </button>
              </>
            )
          ) : (
            <div className="px-3 py-1.5 text-xs text-gray-400 flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 13V5a1 1 0 0 1 1-1h3l2 2h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z" />
              </svg>
              <span>File sync — browser not supported</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
