import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { BoardHeader } from "./BoardHeader";
import { BacklogTable } from "./BacklogTable";
import { DetailPanel } from "./DetailPanel";
import { projectsQueryOptions, useCreateProject, useDeleteProject } from "./projectHooks";
import {
  itemsQueryOptions,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useReorderItems,
  useArchiveItems,
  type ItemChanges,
} from "./itemHooks";
import { statusChangePatch } from "./statusChangePatch";
import { sectionBlockIds } from "./sectionUtils";
import type { Status, Task } from "./types";

const route = getRouteApi("/_auth/board");

function EmptyState() {
  const [name, setName] = useState("");
  const createProject = useCreateProject();

  function create() {
    createProject.mutate(name.trim() || "My Project");
    setName("");
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500">
      <p className="text-sm">No project yet. Create one to get started.</p>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
          }}
          placeholder="Project name..."
          className="border border-gray-200 rounded px-3 py-1.5 text-sm outline-none focus:border-gray-300"
        />
        <button
          onClick={create}
          disabled={createProject.isPending}
          className="px-3 py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded cursor-pointer disabled:opacity-50"
        >
          New project
        </button>
      </div>
    </div>
  );
}

export function BoardPage() {
  const { project: projectParam, detail, archived: showArchived } = route.useSearch();
  const navigate = route.useNavigate();

  const projectsQuery = useQuery(projectsQueryOptions);
  const projects = projectsQuery.data ?? [];
  const selectedId =
    projects.find((p) => p.id === projectParam)?.id ?? projects[0]?.id ?? null;

  const itemsQuery = useQuery({
    ...itemsQueryOptions({
      project_id: selectedId ?? undefined,
      with_archived: showArchived || undefined,
    }),
    enabled: selectedId !== null,
  });
  const items = itemsQuery.data ?? [];

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItemMutation = useDeleteItem();
  const reorderItems = useReorderItems();
  const archiveItems = useArchiveItems();
  const deleteProject = useDeleteProject();

  const detailTask = detail
    ? items.find((i): i is Task => i.id === detail && i.kind === "task")
    : undefined;

  // New items go at the end; explicit position keeps placement under our control.
  function endPosition(): number {
    return items.length > 0 ? Math.max(...items.map((i) => i.position)) + 1000 : 1000;
  }

  function handleAddTask() {
    if (!selectedId) return;
    createItem.mutate({ project_id: selectedId, kind: "task", description: "", position: endPosition() });
  }

  // Fractional position: midpoint between the reference row and its next neighbour.
  function handleAddTaskAfter(afterId: string) {
    if (!selectedId) return;
    const idx = items.findIndex((i) => i.id === afterId);
    const afterPos = idx >= 0 ? items[idx].position : endPosition();
    const nextPos = idx >= 0 && idx + 1 < items.length ? items[idx + 1].position : afterPos + 1000;
    const position = afterPos + (nextPos - afterPos) / 2;
    createItem.mutate({ project_id: selectedId, kind: "task", description: "", position });
  }

  function handleAddSeparator() {
    if (!selectedId) return;
    createItem.mutate({ project_id: selectedId, kind: "separator", label: "New section", position: endPosition() });
  }

  function handleUpdateItem(id: string, changes: ItemChanges) {
    updateItem.mutate({ id, changes });
  }

  function handleUpdateStatus(id: string, status: Status) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    updateItem.mutate({ id, changes: statusChangePatch(item, status) });
  }

  // Archiving a section archives its whole block (separator + tasks).
  function handleArchive(id: string, archive: boolean) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const ids = item.kind === "separator" ? sectionBlockIds(items, id) : [id];
    archiveItems.mutate({ ids, archived: archive });
  }

  function handleDeleteProject(id: string) {
    deleteProject.mutate(id);
    const remaining = projects.filter((p) => p.id !== id);
    navigate({ search: (prev) => ({ ...prev, project: remaining[0]?.id, detail: undefined }) });
  }

  const selectedProject = projects.find((p) => p.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-white">
      {selectedProject && (
        <BoardHeader
          project={selectedProject}
          onDelete={handleDeleteProject}
          showArchived={Boolean(showArchived)}
          onToggleArchived={(value) =>
            navigate({ search: (prev) => ({ ...prev, archived: value || undefined }) })
          }
        />
      )}

      {projectsQuery.isSuccess && projects.length === 0 ? (
        <EmptyState />
      ) : (
        <BacklogTable
          items={items}
          onUpdateItem={handleUpdateItem}
          onUpdateStatus={handleUpdateStatus}
          onDeleteItem={(id) => deleteItemMutation.mutate(id)}
          onReorder={(orderedIds) => reorderItems.mutate(orderedIds)}
          onAddTask={handleAddTask}
          onAddTaskAfter={handleAddTaskAfter}
          onAddSeparator={handleAddSeparator}
          onOpenDetail={(id) => navigate({ search: (prev) => ({ ...prev, detail: id }) })}
          onArchive={handleArchive}
        />
      )}

      {detailTask && (
        <DetailPanel
          task={detailTask}
          onUpdate={handleUpdateItem}
          onUpdateStatus={handleUpdateStatus}
          onClose={() => navigate({ search: (prev) => ({ ...prev, detail: undefined }) })}
        />
      )}
    </div>
  );
}
