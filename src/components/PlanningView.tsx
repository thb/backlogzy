import { useMemo, useState } from "react"
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
import {
  getMonday,
  addDays,
  getDaysInRange,
  formatDateShort,
  toDateStr,
} from "../lib/utils"

type DateRow = { date: string }

type Props = {
  projects: Project[]
  tasks: Task[]
  onOpenDetail: (id: string) => void
}

const columnHelper = createColumnHelper<DateRow>()

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

export function PlanningView({ projects, tasks, onOpenDetail }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const { columnSizing, setColumnSizing } = useColumnSizing("planning")

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

  // Only show projects that have at least one task in the visible week
  const activeProjects = useMemo(() => {
    const projectIdsWithTasks = new Set<string>()
    for (const d of dates) {
      for (const p of projects) {
        if ((taskIndex[d]?.[p.id]?.length ?? 0) > 0) {
          projectIdsWithTasks.add(p.id)
        }
      }
    }
    return projects.filter((p) => projectIdsWithTasks.has(p.id))
  }, [dates, projects, taskIndex])

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "date",
        header: "",
        size: 120,
        cell: ({ row }) => {
          const d = row.original.date
          const isToday = d === toDateStr(new Date())
          return (
            <div
              className={`px-2 py-1 text-xs font-medium ${isToday ? "text-blue-600" : "text-gray-500"}`}
            >
              {formatDateShort(d)}
            </div>
          )
        },
      }),
      ...activeProjects.map((project) => {
        const colorCfg = PROJECT_COLORS.find((c) => c.name === project.color) ?? PROJECT_COLORS[0]
        return columnHelper.display({
          id: project.id,
          header: project.name,
          size: 200,
          meta: { pastel: colorCfg.pastel },
          cell: ({ row }) => {
            const dayTasks = taskIndex[row.original.date]?.[project.id] ?? []
            if (dayTasks.length === 0) return null
            return (
              <div className="flex flex-col gap-0.5 py-0.5">
                {dayTasks.map((t) => (
                  <TaskChip
                    key={t.id}
                    task={t}
                    onClick={() => onOpenDetail(t.id)}
                  />
                ))}
              </div>
            )
          },
        })
      }),
    ],
    [activeProjects, taskIndex, onOpenDetail]
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
