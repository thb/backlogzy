import { useState, useEffect, useRef } from "react"
import { ProjectTabs } from "./components/ProjectTabs"
import { BacklogTable } from "./components/BacklogTable"
import { DetailPanel } from "./components/DetailPanel"
import { useProjects } from "./hooks/useProjects"
import { useItems } from "./hooks/useItems"
import { exportData, importData } from "./lib/backup"
import type { Task } from "./db/types"

function App() {
  const { projects, addProject, renameProject, deleteProject } = useProjects()
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [detailItemId, setDetailItemId] = useState<string | null>(null)
  const initRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    items,
    addTask,
    addSeparator,
    updateItem,
    updateTaskStatus,
    deleteItem,
    deleteAllItems,
    reorderItems,
  } = useItems(activeProjectId)

  const detailTask = detailItemId
    ? (items.find((i) => i.id === detailItemId && i.type === "task") as Task | undefined)
    : undefined

  // Auto-select first project or create default
  useEffect(() => {
    if (projects.length === 0 && !initRef.current) {
      initRef.current = true
      addProject("My Project")
      return
    }
    if (
      projects.length > 0 &&
      (!activeProjectId || !projects.find((p) => p.id === activeProjectId))
    ) {
      setActiveProjectId(projects[0].id)
    }
  }, [projects, activeProjectId])

  function handleDeleteProject(id: string) {
    deleteAllItems()
    deleteProject(id)
    const remaining = projects.filter((p) => p.id !== id)
    if (remaining.length > 0) {
      setActiveProjectId(remaining[0].id)
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) importData(file)
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white">
        <ProjectTabs
          projects={projects}
          activeId={activeProjectId}
          onSelect={setActiveProjectId}
          onAdd={addProject}
          onRename={renameProject}
          onDelete={handleDeleteProject}
        />
        <div className="flex items-center gap-2 px-3 shrink-0">
          <button
            onClick={exportData}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            title="Export backup"
          >
            Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            title="Import backup"
          >
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>
      <BacklogTable
        items={items}
        onUpdateItem={updateItem}
        onUpdateStatus={updateTaskStatus}
        onDeleteItem={deleteItem}
        onReorder={reorderItems}
        onAddTask={() => addTask()}
        onAddSeparator={() => addSeparator()}
        onOpenDetail={setDetailItemId}
      />
      {detailTask && (
        <DetailPanel
          task={detailTask}
          onUpdate={updateItem}
          onUpdateStatus={updateTaskStatus}
          onClose={() => setDetailItemId(null)}
        />
      )}
    </div>
  )
}

export default App
