import { useState, useEffect, useRef } from "react"
import { ProjectTabs } from "./components/ProjectTabs"
import { BacklogTable } from "./components/BacklogTable"
import { PlanningView } from "./components/PlanningView"
import { DetailPanel } from "./components/DetailPanel"
import { useProjects } from "./hooks/useProjects"
import { useItems } from "./hooks/useItems"
import { useAllTasks } from "./hooks/useAllItems"
import { exportData, importData } from "./lib/backup"
import { itemsCollection } from "./db/collections"
import type { Task, Status } from "./db/types"
import { generateId, nowISO } from "./lib/utils"
import { usePomodoros } from "./hooks/usePomodoros"
import { FileSyncButton } from "./components/FileSyncButton"
import { useHabits } from "./hooks/useHabits"

type View = "board" | "planning"

function App() {
  const { projects, addProject, renameProject, setProjectColor, reorderProjects, deleteProject } = useProjects()
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [detailItemId, setDetailItemId] = useState<string | null>(null)
  const [view, setView] = useState<View>("board")
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

  const allTasks = useAllTasks()
  const { getCount: pomodoroCount, addPomodoro, removePomodoro } = usePomodoros()
  const { getHabits, toggleHabit } = useHabits()

  // Find detail task across all items (board) or allTasks (planning)
  const detailTask = detailItemId
    ? (view === "board"
      ? (items.find((i) => i.id === detailItemId && i.type === "task") as Task | undefined)
      : allTasks.find((t) => t.id === detailItemId))
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

  // updateItem that works across projects (for planning view)
  function handleUpdateFromDetail(id: string, changes: Partial<Task>) {
    itemsCollection.update(id, (draft) => {
      Object.assign(draft, changes)
    })
  }

  function handleAssignTask(taskId: string, date: string) {
    itemsCollection.update(taskId, (draft) => {
      const t = draft as Task
      t.plannedStart = date
      if (!t.plannedEnd || t.plannedEnd < date) {
        t.plannedEnd = date
      }
    })
  }

  function handleCreateTaskOnPlanning(projectId: string, description: string, date: string) {
    itemsCollection.insert({
      id: generateId(),
      projectId,
      type: "task",
      description,
      status: "TODO" as Status,
      estimation: null,
      timeSpent: null,
      createdAt: nowISO(),
      completedAt: null,
      notes: "",
      plannedStart: date,
      plannedEnd: date,
      position: Date.now(),
    } as Task)
  }

  function handleUpdateStatusFromDetail(id: string, status: Task["status"]) {
    itemsCollection.update(id, (draft) => {
      ;(draft as Task).status = status
      if ((status === "IN_QA" || status === "IN_PROD") && !(draft as Task).completedAt) {
        ;(draft as Task).completedAt = new Date().toISOString()
      }
    })
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center border-b border-gray-200 bg-white">
        {/* View toggle */}
        <div className="flex items-center gap-0 px-2 pt-2 shrink-0">
          <button
            onClick={() => setView("planning")}
            className={`px-3 py-1.5 text-sm rounded-t-md border border-b-0 cursor-pointer ${view === "planning"
                ? "border-gray-200 bg-white text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            Planning
          </button>
          <button
            onClick={() => setView("board")}
            className={`px-3 py-1.5 text-sm rounded-t-md border border-b-0 cursor-pointer ${view === "board"
                ? "border-gray-200 bg-white text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            Boards
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />

        {/* Project tabs (board view only) */}
        {view === "board" && (
          <ProjectTabs
            projects={projects}
            activeId={activeProjectId}
            onSelect={setActiveProjectId}
            onAdd={addProject}
            onRename={renameProject}
            onDelete={handleDeleteProject}
            onSetColor={setProjectColor}
            onReorder={reorderProjects}
          />
        )}

        {/* Spacer */}
        {view === "planning" && <div className="flex-1" />}

        {/* Export/Import/Sync */}
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
          <div className="w-px h-3 bg-gray-200" />
          <FileSyncButton />
        </div>
      </div>

      {/* Main content */}
      {view === "board" ? (
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
      ) : (
        <PlanningView
          projects={projects}
          tasks={allTasks}
          onOpenDetail={setDetailItemId}
          onAssignTask={handleAssignTask}
          onCreateTask={handleCreateTaskOnPlanning}
          pomodoroCount={pomodoroCount}
          onAddPomodoro={addPomodoro}
          onRemovePomodoro={removePomodoro}
          getHabits={getHabits}
          onToggleHabit={toggleHabit}
        />
      )}

      {/* Detail panel (shared) */}
      {detailTask && (
        <DetailPanel
          task={detailTask}
          onUpdate={
            view === "board" ? updateItem : handleUpdateFromDetail
          }
          onUpdateStatus={
            view === "board" ? updateTaskStatus : handleUpdateStatusFromDetail
          }
          onClose={() => setDetailItemId(null)}
        />
      )}
    </div>
  )
}

export default App
