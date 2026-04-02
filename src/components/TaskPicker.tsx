import { useState, useRef, useEffect } from "react"
import type { Task } from "../db/types"
import { STATUS_CONFIG } from "../db/types"

type Props = {
  /** All tasks for the target project (unplanned or any) */
  projectTasks: Task[]
  onSelect: (taskId: string) => void
  onCreate: (description: string) => void
  onClose: () => void
}

export function TaskPicker({ projectTasks, onSelect, onCreate, onClose }: Props) {
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? projectTasks.filter((t) =>
        t.description.toLowerCase().includes(q)
      )
    : projectTasks

  // Show max 8 results
  const results = filtered.slice(0, 8)
  const exactMatch = projectTasks.some(
    (t) => t.description.toLowerCase() === q
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose()
    }
    if (e.key === "Enter" && q) {
      if (results.length === 1) {
        onSelect(results[0].id)
      } else if (!exactMatch) {
        onCreate(query.trim())
      }
    }
  }

  return (
    <div
      ref={panelRef}
      className="absolute top-0 left-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg w-64 overflow-hidden"
    >
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search or create task..."
        className="w-full px-3 py-2 text-sm outline-none border-b border-gray-100"
      />
      <div className="max-h-48 overflow-y-auto">
        {results.map((task) => {
          const cfg = STATUS_CONFIG[task.status]
          return (
            <button
              key={task.id}
              onClick={() => onSelect(task.id)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer flex items-center gap-2"
            >
              <span className={`shrink-0 w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="truncate text-gray-700">
                {task.description || "Untitled"}
              </span>
            </button>
          )
        })}
        {q && !exactMatch && (
          <button
            onClick={() => onCreate(query.trim())}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 cursor-pointer text-blue-600"
          >
            + Create "<span className="font-medium">{query.trim()}</span>"
          </button>
        )}
        {!q && projectTasks.length === 0 && (
          <div className="px-3 py-2 text-xs text-gray-400">
            No tasks in this project. Type to create one.
          </div>
        )}
      </div>
    </div>
  )
}
