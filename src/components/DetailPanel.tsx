import { useState, useEffect, useRef } from "react"
import type { Task, Status } from "../db/types"
import { STATUS_CONFIG, STATUSES } from "../db/types"
import { formatDate } from "../lib/utils"
import { parseDuration, formatDuration } from "../lib/duration"

type Props = {
  task: Task
  onUpdate: (id: string, changes: Partial<Task>) => void
  onUpdateStatus: (id: string, status: Status) => void
  onClose: () => void
}

export function DetailPanel({ task, onUpdate, onUpdateStatus, onClose }: Props) {
  const [notes, setNotes] = useState(task.notes ?? "")
  const [description, setDescription] = useState(task.description)
  const panelRef = useRef<HTMLDivElement>(null)
  const notesTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Sync state when task changes
  useEffect(() => {
    setNotes(task.notes ?? "")
    setDescription(task.description)
  }, [task.id, task.notes, task.description])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  // Auto-save notes with debounce
  function handleNotesChange(value: string) {
    setNotes(value)
    clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(() => {
      onUpdate(task.id, { notes: value })
    }, 500)
  }

  function commitDescription() {
    if (description !== task.description) {
      onUpdate(task.id, { description })
    }
  }

  const statusConfig = STATUS_CONFIG[task.status]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/10 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-[480px] max-w-[90vw] bg-white shadow-xl z-50 flex flex-col border-l border-gray-200 animate-slide-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Detail</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Description */}
          <div>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={commitDescription}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitDescription()
              }}
              placeholder="Description..."
              className="w-full text-lg font-medium text-gray-900 outline-none border-b border-transparent focus:border-gray-200 pb-1"
            />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Status</label>
              <select
                value={task.status}
                onChange={(e) => onUpdateStatus(task.id, e.target.value as Status)}
                className={`${statusConfig.bg} ${statusConfig.text} rounded px-2 py-1 text-xs font-medium border-0 outline-none cursor-pointer w-full`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Estim.</label>
              <input
                type="text"
                defaultValue={task.estimation != null ? formatDuration(task.estimation) : ""}
                onBlur={(e) => {
                  onUpdate(task.id, { estimation: parseDuration(e.target.value) })
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                }}
                placeholder="2h, 30m, 1j"
                className="w-full text-sm text-gray-700 border border-gray-200 rounded px-2 py-1 outline-none focus:border-gray-300"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Spent</label>
              <input
                type="text"
                defaultValue={task.timeSpent != null ? formatDuration(task.timeSpent) : ""}
                onBlur={(e) => {
                  onUpdate(task.id, { timeSpent: parseDuration(e.target.value) })
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                }}
                placeholder="2h, 30m, 1j"
                className="w-full text-sm text-gray-700 border border-gray-200 rounded px-2 py-1 outline-none focus:border-gray-300"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Planned start</label>
              <input
                type="date"
                value={task.plannedStart ?? ""}
                onChange={(e) => {
                  const val = e.target.value || null
                  onUpdate(task.id, {
                    plannedStart: val,
                    // Auto-set end = start if end is empty or before new start
                    plannedEnd:
                      val && (!task.plannedEnd || task.plannedEnd < val)
                        ? val
                        : task.plannedEnd,
                  })
                }}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded px-2 py-1 outline-none focus:border-gray-300"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Planned end</label>
              <input
                type="date"
                value={task.plannedEnd ?? ""}
                min={task.plannedStart ?? undefined}
                onChange={(e) => {
                  onUpdate(task.id, { plannedEnd: e.target.value || null })
                }}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded px-2 py-1 outline-none focus:border-gray-300"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Done</label>
              <input
                type="date"
                value={task.completedAt ? task.completedAt.slice(0, 10) : ""}
                onChange={(e) => {
                  onUpdate(task.id, { completedAt: e.target.value ? new Date(e.target.value).toISOString() : null })
                }}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded px-2 py-1 outline-none focus:border-gray-300"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes, details, markdown..."
              className="w-full min-h-[200px] text-sm text-gray-700 outline-none resize-y bg-gray-50 rounded-md p-3 border border-gray-200 focus:border-gray-300 font-mono"
            />
            <p className="text-xs text-gray-300 mt-1">Markdown supported. Auto-saved.</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Created</label>
            <span className="text-sm text-gray-600">{formatDate(task.createdAt)}</span>
          </div>
        </div>
      </div>
    </>
  )
}
