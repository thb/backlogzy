const PROJECTS_KEY = "backlogzy-projects"
const ITEMS_KEY = "backlogzy-items"

type BackupData = {
  version: 1
  exportedAt: string
  projects: Record<string, unknown>
  items: Record<string, unknown>
}

export function exportData() {
  const projects = localStorage.getItem(PROJECTS_KEY)
  const items = localStorage.getItem(ITEMS_KEY)

  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: projects ? JSON.parse(projects) : {},
    items: items ? JSON.parse(items) : {},
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `backlogzy-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData
        if (!data.version || !data.projects || !data.items) {
          throw new Error("Invalid backup file")
        }
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(data.projects))
        localStorage.setItem(ITEMS_KEY, JSON.stringify(data.items))
        window.location.reload()
        resolve()
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
