import { useState, useRef, useEffect } from "react"

type Props = {
  projects: Array<{ id: string; name: string }>
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function ProjectTabs({
  projects,
  activeId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  function startRename(id: string, currentName: string) {
    setEditingId(id)
    setEditValue(currentName)
  }

  function commitRename() {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  function handleAddProject() {
    const name = `Project ${projects.length + 1}`
    onAdd(name)
  }

  return (
    <div className="flex items-end gap-0.5 bg-white px-2 pt-2 flex-1 min-w-0">
      {projects.map((project) => {
        const isActive = project.id === activeId
        const isEditing = project.id === editingId
        return (
          <div
            key={project.id}
            className={`group relative flex items-center gap-1 rounded-t-md border border-b-0 px-3 py-1.5 text-sm cursor-pointer select-none ${
              isActive
                ? "border-gray-200 bg-white text-gray-900 font-medium"
                : "border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            onClick={() => !isEditing && onSelect(project.id)}
            onDoubleClick={() => startRename(project.id, project.name)}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename()
                  if (e.key === "Escape") setEditingId(null)
                }}
                className="w-24 bg-transparent outline-none text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span>{project.name}</span>
                {isActive && projects.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(project.id)
                    }}
                    className="ml-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs"
                    title="Delete project"
                  >
                    &times;
                  </button>
                )}
              </>
            )}
          </div>
        )
      })}
      <button
        onClick={handleAddProject}
        className="flex items-center justify-center rounded-t-md border border-b-0 border-transparent px-2.5 py-1.5 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
        title="Add project"
      >
        +
      </button>
    </div>
  )
}
