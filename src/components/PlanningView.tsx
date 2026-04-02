import { useMemo, useState, useRef, useEffect } from "react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { Project, Task } from "../db/types"
import { STATUS_CONFIG, PROJECT_COLORS } from "../db/types"
import { formatDuration } from "../lib/duration"
import { useColumnSizing } from "../hooks/useColumnSizing"
import { TaskPicker } from "./TaskPicker"
import { HABIT_OPTIONS } from "../hooks/useHabits"
import {
  getMonday,
  addDays,
  getDaysInRange,
  formatDateShort,
  toDateStr,
} from "../lib/utils"

type DateRow = { date: string }

type CellTarget = { date: string; projectId: string } | null

type Props = {
  projects: Project[]
  tasks: Task[]
  onOpenDetail: (id: string) => void
  onAssignTask: (taskId: string, date: string) => void
  onCreateTask: (projectId: string, description: string, date: string) => void
  pomodoroCount: (date: string) => number
  onAddPomodoro: (date: string) => void
  onRemovePomodoro: (date: string) => void
  getHabits: (date: string) => string[]
  onToggleHabit: (date: string, emoji: string) => void
}

const columnHelper = createColumnHelper<DateRow>()

function HabitPicker({
  date,
  habits,
  onToggle,
}: {
  date: string
  habits: string[]
  onToggle: (date: string, emoji: string) => void
}) {
  const [open, setOpen] = useState(false)
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

  return (
    <div className="flex items-center gap-0.5 mt-0.5 flex-wrap" ref={ref}>
      {habits.length > 0 && (
        <span className="text-xs leading-none">
          {habits.map((emoji) => (
            <button
              key={emoji}
              onClick={(e) => {
                e.stopPropagation()
                onToggle(date, emoji)
              }}
              className="cursor-pointer hover:opacity-60"
              title="Remove"
            >
              {emoji}
            </button>
          ))}
        </span>
      )}
      <div className="relative inline-block">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open)
          }}
          className="text-[10px] text-gray-300 hover:text-blue-400 cursor-pointer leading-none"
          title="Log habit"
        >
          +
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-md shadow-sm flex gap-0.5 p-1">
            {HABIT_OPTIONS.map(({ emoji, label }) => {
              const active = habits.includes(emoji)
              return (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggle(date, emoji)
                  }}
                  className={`text-sm cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100 ${active ? "opacity-40" : ""}`}
                  title={label}
                >
                  {emoji}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskChip({
  task,
  onClick,
}: {
  task: Task
  onClick: () => void
}) {
  const cfg = STATUS_CONFIG[task.status]
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-1.5 py-1 rounded text-xs hover:bg-gray-50 cursor-pointer flex items-start gap-1.5 min-w-0"
    >
      <span
        className={`shrink-0 w-2.5 h-2.5 rounded-full mt-0.5 ${cfg.dot}`}
      />
      <span className="flex-1 text-gray-700 break-words whitespace-normal">
        {task.description || "Untitled"}
      </span>
      {task.estimation != null && (
        <span className="shrink-0 text-gray-400 mt-0.5">{formatDuration(task.estimation)}</span>
      )}
    </button>
  )
}

export function PlanningView({
  projects,
  tasks,
  onOpenDetail,
  onAssignTask,
  onCreateTask,
  pomodoroCount,
  onAddPomodoro,
  onRemovePomodoro,
  getHabits,
  onToggleHabit,
}: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const { columnSizing, setColumnSizing } = useColumnSizing("planning")
  const [pickerTarget, setPickerTarget] = useState<CellTarget>(null)

  const dates = useMemo(
    () => getDaysInRange(weekStart, 7),
    [weekStart]
  )

  const rows: DateRow[] = useMemo(
    () => dates.map((date) => ({ date })),
    [dates]
  )

  // Index tasks by date × project for O(1) lookups
  const taskIndex = useMemo(() => {
    const idx: Record<string, Record<string, Task[]>> = {}
    for (const d of dates) {
      idx[d] = {}
      for (const p of projects) idx[d][p.id] = []
    }
    for (const t of tasks) {
      if (!t.plannedStart) continue
      const start = t.plannedStart
      const end = t.plannedEnd ?? t.plannedStart
      for (const d of dates) {
        if (d >= start && d <= end) {
          idx[d]?.[t.projectId]?.push(t)
        }
      }
    }
    return idx
  }, [dates, projects, tasks])

  // Show projects that have tasks this week, OR all projects (so we can add to empty ones)
  const visibleProjects = projects

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "date",
        header: "",
        size: 120,
        cell: ({ row }) => {
          const d = row.original.date
          const isToday = d === toDateStr(new Date())
          const count = pomodoroCount(d)
          return (
            <div className={`px-2 py-1 ${isToday ? "text-blue-600" : "text-gray-500"}`}>
              <div className="text-xs font-medium">{formatDateShort(d)}</div>
              <div className="flex items-center gap-0.5 mt-0.5">
                {count > 0 && (
                  <span className="text-xs leading-none">
                    {"🍅".repeat(Math.min(count, 10))}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddPomodoro(d)
                  }}
                  className="text-[10px] text-gray-300 hover:text-red-400 cursor-pointer leading-none"
                  title="Add pomodoro"
                >
                  +
                </button>
                {count > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemovePomodoro(d)
                    }}
                    className="text-[10px] text-gray-300 hover:text-red-400 cursor-pointer leading-none"
                    title="Remove pomodoro"
                  >
                    −
                  </button>
                )}
              </div>
              <HabitPicker
                date={d}
                habits={getHabits(d)}
                onToggle={onToggleHabit}
              />
            </div>
          )
        },
      }),
      ...visibleProjects.map((project) => {
        const colorCfg = PROJECT_COLORS.find((c) => c.name === project.color) ?? PROJECT_COLORS[0]
        return columnHelper.display({
          id: project.id,
          header: project.name,
          size: 200,
          meta: { pastel: colorCfg.pastel, projectId: project.id },
          cell: ({ row }) => {
            const date = row.original.date
            const dayTasks = taskIndex[date]?.[project.id] ?? []
            const isPickerOpen =
              pickerTarget?.date === date && pickerTarget?.projectId === project.id

            // Tasks available for this project (not already planned on this date)
            const projectTasks = tasks.filter(
              (t) => t.projectId === project.id
            )

            return (
              <div
                className="relative min-h-[28px] cursor-pointer"
                onClick={() => {
                  if (!isPickerOpen) {
                    setPickerTarget({ date, projectId: project.id })
                  }
                }}
              >
                {dayTasks.length > 0 && (
                  <div
                    className="flex flex-col gap-0.5 py-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {dayTasks.map((t) => (
                      <TaskChip
                        key={t.id}
                        task={t}
                        onClick={() => onOpenDetail(t.id)}
                      />
                    ))}
                  </div>
                )}
                {isPickerOpen && (
                  <TaskPicker
                    projectTasks={projectTasks}
                    onSelect={(taskId) => {
                      onAssignTask(taskId, date)
                      setPickerTarget(null)
                    }}
                    onCreate={(desc) => {
                      onCreateTask(project.id, desc, date)
                      setPickerTarget(null)
                    }}
                    onClose={() => setPickerTarget(null)}
                  />
                )}
              </div>
            )
          },
        })
      }),
    ],
    [visibleProjects, taskIndex, onOpenDetail, onAssignTask, onCreateTask, pickerTarget, tasks, pomodoroCount, onAddPomodoro, onRemovePomodoro, getHabits, onToggleHabit]
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.date,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: { columnSizing },
    onColumnSizingChange: setColumnSizing,
  })

  const weekEndDate = addDays(weekStart, 6)
  const fmtRange = `${weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — ${weekEndDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Week navigation */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 border-b border-gray-200 bg-white">
        <button
          onClick={() => setWeekStart((s) => addDays(s, -7))}
          className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          ← prev
        </button>
        <button
          onClick={() => setWeekStart(getMonday(new Date()))}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
        >
          {fmtRange}
        </button>
        <button
          onClick={() => setWeekStart((s) => addDays(s, 7))}
          className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          next →
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ tableLayout: "fixed" }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50">
              {table.getHeaderGroups().map((hg) =>
                hg.headers.map((header) => {
                  const pastel = (header.column.columnDef.meta as any)?.pastel ?? ""
                  return (
                    <th
                      key={header.id}
                      className={`relative border border-gray-200 px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide ${pastel || "bg-gray-50"}`}
                      style={{ width: header.getSize() }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-400 ${header.column.getIsResizing() ? "bg-blue-500" : ""}`}
                        />
                      )}
                    </th>
                  )
                })
              )}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const isToday = row.original.date === toDateStr(new Date())
              return (
                <tr
                  key={row.id}
                  className={isToday ? "bg-blue-50/30" : ""}
                >
                  {row.getVisibleCells().map((cell) => {
                    const pastel = (cell.column.columnDef.meta as any)?.pastel ?? ""
                    return (
                      <td
                        key={cell.id}
                        className={`border border-gray-200 align-top ${pastel}`}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
