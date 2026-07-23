import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Item, Status } from "./types";
import type { ItemChanges } from "./itemHooks";
import { useColumnSizing } from "./useColumnSizing";
import { useCollapsedSections } from "./useCollapsedSections";
import { visibleItems, sectionCounts, reorderWithHidden } from "./sectionUtils";
import { buildBoardColumns } from "./boardColumns";
import { BoardRow } from "./BoardRow";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = {
  items: Item[];
  onUpdateItem: (id: string, changes: ItemChanges) => void;
  onUpdateStatus: (id: string, status: Status) => void;
  onDeleteItem: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onAddTask: () => void;
  onAddTaskAfter: (afterId: string) => void;
  onAddSeparator: () => void;
  onOpenDetail: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
};

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
  onArchive,
}: Props) {
  const { columnSizing, setColumnSizing } = useColumnSizing("board");
  const { collapsed, toggle } = useCollapsedSections();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const deleteItem = deleteConfirmId ? items.find((i) => i.id === deleteConfirmId) : null;

  const visible = useMemo(() => visibleItems(items, collapsed), [items, collapsed]);
  const counts = useMemo(() => sectionCounts(items), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const columns = useMemo(
    () =>
      buildBoardColumns({
        onUpdateItem,
        onUpdateStatus,
        onAddTaskAfter,
        onOpenDetail,
        onRequestDelete: setDeleteConfirmId,
        onArchive,
      }),
    [onUpdateItem, onUpdateStatus, onAddTaskAfter, onOpenDetail, onArchive],
  );

  const table = useReactTable({
    data: visible,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: { columnSizing },
    onColumnSizingChange: setColumnSizing,
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(reorderWithHidden(items, collapsed, String(active.id), String(over.id)));
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
                      header.getContext(),
                    )}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-400 ${header.column.getIsResizing() ? "bg-blue-500" : ""}`}
                      />
                    )}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <SortableContext
            items={visible.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <BoardRow
                  key={row.id}
                  row={row}
                  columnCount={columns.length}
                  onRequestDelete={setDeleteConfirmId}
                  onAddTaskAfter={onAddTaskAfter}
                  onArchive={onArchive}
                  isCollapsed={collapsed.has(row.original.id)}
                  hiddenCount={counts.get(row.original.id) ?? 0}
                  onToggleCollapse={toggle}
                />
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
          title={deleteItem.kind === "separator" ? "Delete separator?" : "Delete task?"}
          message={
            deleteItem.kind === "separator"
              ? `The separator "${deleteItem.label || "Untitled"}" will be permanently deleted.`
              : `The task "${deleteItem.description || "Untitled"}" will be permanently deleted.`
          }
          onConfirm={() => {
            onDeleteItem(deleteItem.id);
            setDeleteConfirmId(null);
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}
