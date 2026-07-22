import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { Project } from "./types";
import { useCreateProject, useUpdateProject, useReorderProjects } from "./projectHooks";
import { SortableTab, ColorPicker } from "./ProjectTab";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = {
  projects: Project[];
  activeId: string | null;
  onSelect: (id: string) => void;
  // Deletion is owned by the page: it must also move the URL to a remaining project.
  onDelete: (id: string) => void;
};

export function ProjectTabs({ projects, activeId, onSelect, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const reorderProjects = useReorderProjects();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  function commitRename() {
    if (editingId && editValue.trim()) {
      updateProject.mutate({ id: editingId, changes: { name: editValue.trim() } });
    }
    setEditingId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(projects, oldIndex, newIndex);
    reorderProjects.mutate(reordered.map((p) => p.id));
  }

  const deleteProject = deleteConfirm
    ? projects.find((p) => p.id === deleteConfirm)
    : null;

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
                    setEditingId(project.id);
                    setEditValue(project.name);
                  }}
                  onEditChange={setEditValue}
                  onCommitRename={commitRename}
                  onCancelRename={() => setEditingId(null)}
                  onDelete={() => setDeleteConfirm(project.id)}
                  onColorClick={(e) => {
                    e.stopPropagation();
                    setColorPickerId(
                      colorPickerId === project.id ? null : project.id,
                    );
                  }}
                />
                {colorPickerId === project.id && (
                  <ColorPicker
                    current={project.color}
                    onChange={(color) => updateProject.mutate({ id: project.id, changes: { color } })}
                    onClose={() => setColorPickerId(null)}
                  />
                )}
              </div>
            ))}
          </SortableContext>
        </DndContext>
        <button
          onClick={() => createProject.mutate(`Project ${projects.length + 1}`)}
          className="flex items-center justify-center rounded-t-md border border-b-0 border-transparent px-2.5 py-1.5 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          title="Add project"
        >
          +
        </button>
      </div>

      {/* Delete confirmation */}
      {deleteProject && (
        <ConfirmDialog
          title="Delete project?"
          message={`${deleteProject.name} and all its tasks will be permanently deleted. This cannot be undone.`}
          onConfirm={() => {
            onDelete(deleteProject.id);
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
