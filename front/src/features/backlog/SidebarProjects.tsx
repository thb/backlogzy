import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "@tanstack/react-router";
import { Kanban, ChevronRight, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { projectsQueryOptions, useCreateProject, useReorderProjects } from "./projectHooks";
import { SidebarProjectRow } from "./SidebarProjectRow";

// "Boards" sidebar group: one draggable sub-item per project, expanded by default.
export function SidebarProjects() {
  const { pathname } = useLocation();
  const search = useSearch({ strict: false }) as { project?: string };
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const projects = useQuery(projectsQueryOptions).data ?? [];
  const createProject = useCreateProject();
  const reorderProjects = useReorderProjects();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onBoard = pathname.startsWith("/board");
  const activeId = onBoard ? (search.project ?? projects[0]?.id) : undefined;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    reorderProjects.mutate(arrayMove(projects, oldIndex, newIndex).map((p) => p.id));
  }

  function commitAdd() {
    const trimmed = name.trim();
    if (trimmed) createProject.mutate(trimmed);
    setName("");
    setAdding(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        <Kanban className="h-4 w-4" />
        <span className="flex-1 text-left">Boards</span>
        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <ul className="ml-[1.4rem] mt-0.5 space-y-0.5 border-l border-border pl-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {projects.map((project) => (
                <SidebarProjectRow key={project.id} project={project} isActive={project.id === activeId} />
              ))}
            </SortableContext>
          </DndContext>
          <li>
            {adding ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitAdd}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitAdd();
                  if (e.key === "Escape") setAdding(false);
                }}
                placeholder="Board name..."
                className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-gray-300"
              />
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
              >
                <Plus className="h-3.5 w-3.5" />
                New board
              </button>
            )}
          </li>
        </ul>
      )}
    </div>
  );
}
