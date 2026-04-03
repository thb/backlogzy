/**
 * File System Access API wrapper for local file persistence.
 * Reads/writes a single JSON file containing all app data.
 */

const HANDLE_KEY = "backlogzy-file-connected"

// Storage keys to sync
const SYNC_KEYS = [
  "backlogzy-projects",
  "backlogzy-items",
  "backlogzy-pomodoros",
  "backlogzy-habits",
] as const

type FileData = {
  version: 2
  savedAt: string
  data: Record<string, string> // localStorage key → value
}

let fileHandle: FileSystemFileHandle | null = null

/** Check if File System Access API is available */
export function isFileApiSupported(): boolean {
  return "showOpenFilePicker" in window
}

/** Check if we have a connected file */
export function isFileConnected(): boolean {
  return fileHandle !== null
}

/** Get connected file name */
export function getFileName(): string | null {
  return fileHandle?.name ?? null
}

/** Pick an existing file or create a new one */
export async function connectFile(): Promise<boolean> {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Backlogzy Data",
          accept: { "application/json": [".json"] },
        },
      ],
      startIn: "documents",
    })
    fileHandle = handle
    sessionStorage.setItem(HANDLE_KEY, "1")
    return true
  } catch {
    // User cancelled
    return false
  }
}

/** Create a new file */
export async function createFile(): Promise<boolean> {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: "backlogzy-data.json",
      types: [
        {
          description: "Backlogzy Data",
          accept: { "application/json": [".json"] },
        },
      ],
      startIn: "documents",
    })
    fileHandle = handle
    sessionStorage.setItem(HANDLE_KEY, "1")
    // Write current data to file immediately
    await saveToFile()
    return true
  } catch {
    return false
  }
}

/** Disconnect from file (go back to localStorage only) */
export function disconnectFile() {
  fileHandle = null
  sessionStorage.removeItem(HANDLE_KEY)
}

/** Read data from file and load into localStorage */
export async function loadFromFile(): Promise<boolean> {
  if (!fileHandle) return false
  try {
    const file = await fileHandle.getFile()
    const text = await file.text()
    if (!text.trim()) return false // Empty file
    const fileData = JSON.parse(text) as FileData
    if (!fileData.data) return false

    for (const [key, value] of Object.entries(fileData.data)) {
      localStorage.setItem(key, value)
    }
    return true
  } catch (err) {
    console.error("Failed to load from file:", err)
    return false
  }
}

/** Save localStorage data to file */
export async function saveToFile(): Promise<boolean> {
  if (!fileHandle) return false
  try {
    const data: Record<string, string> = {}
    for (const key of SYNC_KEYS) {
      const value = localStorage.getItem(key)
      if (value) data[key] = value
    }
    // Also save column sizing and migrations
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith("backlogzy-colsizing-") || key === "backlogzy-migrations")) {
        const value = localStorage.getItem(key)
        if (value) data[key] = value
      }
    }

    const fileData: FileData = {
      version: 2,
      savedAt: new Date().toISOString(),
      data,
    }

    const writable = await fileHandle.createWritable()
    await writable.write(JSON.stringify(fileData, null, 2))
    await writable.close()
    return true
  } catch (err) {
    console.error("Failed to save to file:", err)
    return false
  }
}

/**
 * Auto-save: listen for localStorage changes and save to file.
 * Call once at app init.
 */
let saveTimer: ReturnType<typeof setTimeout> | null = null

export function startAutoSave() {
  // Intercept localStorage.setItem to detect changes
  const originalSetItem = localStorage.setItem.bind(localStorage)
  localStorage.setItem = (key: string, value: string) => {
    originalSetItem(key, value)
    if (fileHandle && key.startsWith("backlogzy-")) {
      // Debounce saves
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => saveToFile(), 500)
    }
  }

  // Also intercept removeItem
  const originalRemoveItem = localStorage.removeItem.bind(localStorage)
  localStorage.removeItem = (key: string) => {
    originalRemoveItem(key)
    if (fileHandle && key.startsWith("backlogzy-")) {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => saveToFile(), 500)
    }
  }
}
