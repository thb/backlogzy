import { useMemo, useState, type CSSProperties } from "react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Row,
} from "@tanstack/react-table"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Item, Status } from "../db/types"
import { useColumnSizing } from "../hooks/useColumnSizing"
import { EditableCell } from "./EditableCell"
import { StatusSelect } from "./StatusSelect"
import { HoursCell } from "./HoursCell"
import { EditableDateCell } from "./EditableDateCell"
import { ConfirmDialog } from "./ConfirmDialog"

type Props = {
  items: Item[]
  onUpdateItem: (id: string, changes: Partial<Item>) => void
  onUpdateStatus: (id: string, status: Status) => void
  onDeleteItem: (id: string) => void
  onReorder: (orderedIds: string[]) => void
  onAddTask: () => void
  onAddTaskAfter: (afterId: string) => void
  onAddSeparator: () => void
  onOpenDetail: (id: string) => void
}

const columnHelper = createColumnHelper<Item>()

function DragHandle({
  listeners,
  attributes,
}: {
  listeners: Record<string, Function> | undefined
  attributes: Record<string, any>
}) {
  return (
    <div
      className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex items-center justify-center h-full"
      {...attributes}
      {...listeners}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="3" r="1.5" />
        <circle cx="11" cy="3" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="13" r="1.5" />
        <circle cx="11" cy="13" r="1.5" />
      </svg>
    </div>
  )
}

function SortableRow({
  row,
  columns,
  onRequestDelete,
}: {
  row: Row<Item>
  columns: any[]
  onRequestDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.original.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    zIndex: isDragging ? 1 : 0,
  }

  const isSeparator = row.original.type === "separator"

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group/row ${isSeparator ? "bg-gray-50" : "hover:bg-blue-50/30"}`}
    >
      {isSeparator ? (
        <>
          {row.getVisibleCells().map((cell, idx) => {
            if (idx === 0) {
              return (
                <td
                  key={cell.id}
                  className="border border-gray-200"
                  style={{ width: cell.column.getSize() }}
                >
                  <DragHandle listeners={listeners} attributes={attributes} />
                </td>
              )
            }
            if (idx === 1) {
              return (
                <td
                  key={cell.id}
                  colSpan={columns.length - 2}
                  className="border border-gray-200"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              )
            }
            // Last cell = delete button
            if (idx === row.getVisibleCells().length - 1) {
              return (
                <td
                  key={cell.id}
                  className="border border-gray-200"
                  style={{ width: cell.column.getSize() }}
                >
                  <button
                    onClick={() => onRequestDelete(row.original.id)}
                    className="opacity-0 group-hover/row:opacity-100 text-gray-300 hover:text-red-500 text-sm px-1 cursor-pointer"
                    title="Delete separator"
                  >
                    &times;
                  </button>
                </td>
              )
            }
            return null
          })}
        </>
      ) : (
        row.getVisibleCells().map((cell, idx) => (
          <td
            key={cell.id}
            className="border border-gray-200"
            style={{ width: cell.column.getSize() }}
          >
            {idx === 0 ? (
              <DragHandle listeners={listeners} attributes={attributes} />
            ) : (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            )}
          </td>
        ))
      )}
    </tr>
  )
}

export function BacklogTable({
  items,
  onUpdateItem,
  onUpdateStatus,
  onDeleteItem,
  onReorder,
  onAddTask,
  onAddTaskAfter,
  onAddSeparator,
  onOpenDetail,
}: Props) {
  const { columnSizing, setColumnSizing } = useColumnSizing("board")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const deleteItem = deleteConfirmId ? items.find((i) => i.id === deleteConfirmId) : null

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "drag",
        header: "",
        size: 32,
        enableResizing: false,
        cell: () => null, // Rendered by SortableRow directly
      }),
      columnHelper.display({
        id: "description",
        header: "Description",
        size: 400,
        cell: ({ row }) => {
          const item = row.original
          if (item.type === "separator") {
            return (
              <EditableCell
                value={item.label}
                onChange={(label) => onUpdateItem(item.id, { label })}
                placeholder="Section name..."
                className="font-semibold text-gray-700 text-xs"
              />
            )
          }
          const hasNotes = !!(item.notes)
          return (
            <div className="flex items-center group/desc">
              <EditableCell
                value={item.description}
                onChange={(description) =>
                  onUpdateItem(item.id, { description })
                }
                placeholder="Description..."
                className="flex-1 text-xs"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenDetail(item.id)
                }}
                className={`shrink-0 px-1 cursor-pointer ${hasNotes ? "text-gray-400" : "text-gray-200 opacity-0 group-hover/desc:opacity-100"} hover:text-gray-600`}
                title="Open detail"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="12" height="12" rx="2" />
                  <line x1="5" y1="5.5" x2="11" y2="5.5" />
                  <line x1="5" y1="8" x2="11" y2="8" />
                  <line x1="5" y1="10.5" x2="8.5" y2="10.5" />
                </svg>
              </button>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "status",
        header: "Status",
        size: 100,
        cell: ({ row }) => {
          const item = row.original
          if (item.type === "separator") return null
          return (
            <StatusSelect
              value={item.status}
              onChange={(status) => onUpdateStatus(item.id, status)}
            />
          )
        },
      }),
      columnHelper.display({
        id: "estimation",
        header: "Estim.",
        size: 70,
        cell: ({ row }) => {
          const item = row.original
          if (item.type === "separator") return null
          return (
            <HoursCell
              value={item.estimation}
              onChange={(estimation) =>
                onUpdateItem(item.id, { estimation })
              }
            />
          )
        },
      }),
      columnHelper.display({
        id: "timeSpent",
        header: "Spent",
        size: 70,
        cell: ({ row }) => {
          const item = row.original
          if (item.type === "separator") return null
          return (
            <HoursCell
              value={item.timeSpent}
              onChange={(timeSpent) =>
                onUpdateItem(item.id, { timeSpent })
              }
            />
          )
        },
      }),
      columnHelper.display({
        id: "plannedStart",
        header: "Start",
        size: 110,
        cell: ({ row }) => {
          const item = row.original
          if (item.type === "separator") return null
          return (
            <EditableDateCell
              value={item.plannedStart}
              onChange={(plannedStart) => {
                const changes: Partial<typeof item> = { plannedStart }
                if (plannedStart) {
                  if (!item.plannedEnd || item.plannedEnd < plannedStart) {
                    changes.plannedEnd = plannedStart
                  }
                }
                onUpdateItem(item.id, changes)
              }}
            />
          )
        },
      }),
      columnHelper.display({
        id: "plannedEnd",
        header: "End",
        size: 110,
        cell: ({ row }) => {
          const item = row.original
          if (item.type === "separator") return null
          return (
            <EditableDateCell
              value={item.plannedEnd}
              onChange={(plannedEnd) => {
                const start = item.plannedStart
                if (plannedEnd && !start) {
                  onUpdateItem(item.id, { plannedStart: plannedEnd, plannedEnd })
                } else if (!plannedEnd && start) {
                  onUpdateItem(item.id, { plannedEnd: start })
                } else if (plannedEnd && start && plannedEnd < start) {
                  onUpdateItem(item.id, { plannedEnd: start })
                } else {
                  onUpdateItem(item.id, { plannedEnd })
                }
              }}
            />
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        size: 48,
        enableResizing: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-center opacity-0 group-hover/row:opacity-100 h-[28px]">
            <button
              onClick={() => setDeleteConfirmId(row.original.id)}
              className="text-gray-300 hover:text-red-500 text-sm px-0.5 cursor-pointer"
              title="Delete"
            >
              &times;
            </button>
            <button
              onClick={() => onAddTaskAfter(row.original.id)}
              className="text-gray-300 hover:text-blue-500 text-sm px-0.5 cursor-pointer"
              title="Add task below"
            >
              +
            </button>
          </div>
        ),
      }),
    ],
    [onUpdateItem, onUpdateStatus, onDeleteItem, onOpenDetail]
  )

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: { columnSizing },
    onColumnSizingChange: setColumnSizing,
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    onReorder(reordered.map((i) => i.id))
  }

  return (
    <div className="flex-1 overflow-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full border-collapse text-sm" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="relative border border-gray-200 px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-400 ${header.column.getIsResizing() ? "bg-blue-500" : ""}`}
                      />
                    )}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <SortableRow key={row.id} row={row} columns={columns} onRequestDelete={setDeleteConfirmId} />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>

      <div className="flex gap-2 px-2 py-2">
        <button
          onClick={onAddTask}
          className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          + Add task
        </button>
        <button
          onClick={onAddSeparator}
          className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          + Add separator
        </button>
      </div>

      {deleteItem && (
        <ConfirmDialog
          title={deleteItem.type === "separator" ? "Delete separator?" : "Delete task?"}
          message={
            deleteItem.type === "separator"
              ? `The separator "${(deleteItem as any).label || "Untitled"}" will be permanently deleted.`
              : `The task "${(deleteItem as any).description || "Untitled"}" will be permanently deleted.`
          }
          onConfirm={() => {
            onDeleteItem(deleteItem.id)
            setDeleteConfirmId(null)
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  )
}
