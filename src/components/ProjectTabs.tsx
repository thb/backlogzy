import { useState, useRef, useEffect } from "react"
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
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { PROJECT_COLORS, type ProjectColor } from "../db/types"

type ProjectItem = {
  id: string
  name: string
  color: ProjectColor
}

type Props = {
  projects: ProjectItem[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onSetColor: (id: string, color: ProjectColor) => void
  onReorder: (orderedIds: string[]) => void
}

function ColorPicker({
  current,
  onChange,
  onClose,
}: {
  current: ProjectColor
  onChange: (c: ProjectColor) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-1.5 flex gap-1 z-50"
    >
      {PROJECT_COLORS.map((c) => (
        <button
          key={c.name}
          onClick={(e) => {
            e.stopPropagation()
            onChange(c.name)
            onClose()
          }}
          className={`w-5 h-5 rounded-full ${c.dot} cursor-pointer ${c.name === current ? "ring-2 ring-offset-1 ring-gray-400" : "hover:scale-110"} transition-transform`}
        />
      ))}
    </div>
  )
}

function ConfirmDelete({
  projectName,
  onConfirm,
  onCancel,
}: {
  projectName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-50" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-5 z-50 w-80">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Delete project?
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          <strong>{projectName}</strong> and all its tasks will be permanently
          deleted. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </>
  )
}

function SortableTab({
  project,
  isActive,
  isEditing,
  editValue,
  inputRef,
  onSelect,
  onStartRename,
  onEditChange,
  onCommitRename,
  onCancelRename,
  onDelete,
  onColorClick,
}: {
  project: ProjectItem
  isActive: boolean
  isEditing: boolean
  editValue: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onSelect: () => void
  onStartRename: () => void
  onEditChange: (v: string) => void
  onCommitRename: () => void
  onCancelRename: () => void
  onDelete: () => void
  onColorClick: (e: React.MouseEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id })

  const colorCfg = PROJECT_COLORS.find((c) => c.name === project.color) ?? PROJECT_COLORS[0]

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-1.5 text-sm cursor-pointer select-none ${
        isActive
          ? `border-gray-200 bg-white text-gray-900 font-medium border-t-2 ${colorCfg.tab}`
          : "border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
      onClick={() => !isEditing && onSelect()}
      onDoubleClick={onStartRename}
      {...attributes}
      {...listeners}
    >
      {/* Color dot */}
      <button
        onClick={onColorClick}
        className={`shrink-0 w-2.5 h-2.5 rounded-full ${colorCfg.dot} hover:scale-125 transition-transform cursor-pointer`}
        title="Change color"
      />

      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onCommitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitRename()
            if (e.key === "Escape") onCancelRename()
          }}
          className="w-24 bg-transparent outline-none text-sm"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="truncate">{project.name}</span>
          {isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="ml-0.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs cursor-pointer"
              title="Delete project"
            >
              &times;
            </button>
          )}
        </>
      )}
    </div>
  )
}

export function ProjectTabs({
  projects,
  activeId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  onSetColor,
  onReorder,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [colorPickerId, setColorPickerId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  function commitRename() {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = projects.findIndex((p) => p.id === active.id)
    const newIndex = projects.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(projects, oldIndex, newIndex)
    onReorder(reordered.map((p) => p.id))
  }

  const deleteProject = deleteConfirm
    ? projects.find((p) => p.id === deleteConfirm)
    : null

  return (
    <>
      <div className="flex items-end gap-0.5 bg-white px-2 pt-2 flex-1 min-w-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={projects.map((p) => p.id)}
            strategy={horizontalListSortingStrategy}
          >
            {projects.map((project) => (
              <div key={project.id} className="relative">
                <SortableTab
                  project={project}
                  isActive={project.id === activeId}
                  isEditing={project.id === editingId}
                  editValue={editValue}
                  inputRef={inputRef}
                  onSelect={() => onSelect(project.id)}
                  onStartRename={() => {
                    setEditingId(project.id)
                    setEditValue(project.name)
                  }}
                  onEditChange={setEditValue}
                  onCommitRename={commitRename}
                  onCancelRename={() => setEditingId(null)}
                  onDelete={() => setDeleteConfirm(project.id)}
                  onColorClick={(e) => {
                    e.stopPropagation()
                    setColorPickerId(
                      colorPickerId === project.id ? null : project.id
                    )
                  }}
                />
                {colorPickerId === project.id && (
                  <ColorPicker
                    current={project.color}
                    onChange={(c) => onSetColor(project.id, c)}
                    onClose={() => setColorPickerId(null)}
                  />
                )}
              </div>
            ))}
          </SortableContext>
        </DndContext>
        <button
          onClick={() => onAdd(`Project ${projects.length + 1}`)}
          className="flex items-center justify-center rounded-t-md border border-b-0 border-transparent px-2.5 py-1.5 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          title="Add project"
        >
          +
        </button>
      </div>

      {/* Delete confirmation */}
      {deleteProject && (
        <ConfirmDelete
          projectName={deleteProject.name}
          onConfirm={() => {
            onDelete(deleteProject.id)
            setDeleteConfirm(null)
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </>
  )
}
