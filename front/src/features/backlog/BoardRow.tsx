import type { CSSProperties } from "react";
import { flexRender, type Row } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Item } from "./types";

type Sortable = ReturnType<typeof useSortable>;

function DragHandle({
  listeners,
  attributes,
}: {
  listeners: Sortable["listeners"];
  attributes: Sortable["attributes"];
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
  );
}

export function BoardRow({
  row,
  columnCount,
  onRequestDelete,
  onAddTaskAfter,
  isCollapsed,
  hiddenCount,
  onToggleCollapse,
}: {
  row: Row<Item>;
  columnCount: number;
  onRequestDelete: (id: string) => void;
  onAddTaskAfter: (afterId: string) => void;
  isCollapsed: boolean;
  hiddenCount: number;
  onToggleCollapse: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.original.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    zIndex: isDragging ? 1 : 0,
  };

  const isSeparator = row.original.kind === "separator";

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
              );
            }
            if (idx === 1) {
              return (
                <td
                  key={cell.id}
                  colSpan={columnCount - 2}
                  className="border border-gray-200"
                >
                  <div className="flex items-center">
                    <button
                      onClick={() => onToggleCollapse(row.original.id)}
                      className="shrink-0 px-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                      title={isCollapsed ? "Expand section" : "Collapse section"}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                      >
                        <path d="M6 3l5 5-5 5V3z" />
                      </svg>
                    </button>
                    <div className="min-w-0 flex-1">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                    {isCollapsed && hiddenCount > 0 && (
                      <span className="mr-2 shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-500">
                        {hiddenCount} task{hiddenCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </td>
              );
            }
            // Last cell = row actions (delete + add task below, like task rows)
            if (idx === row.getVisibleCells().length - 1) {
              return (
                <td
                  key={cell.id}
                  className="border border-gray-200"
                  style={{ width: cell.column.getSize() }}
                >
                  <div className="flex items-center justify-center opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100">
                    <button
                      onClick={() => onRequestDelete(row.original.id)}
                      className="text-gray-300 hover:text-red-500 text-sm px-0.5 cursor-pointer"
                      title="Delete separator"
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
                </td>
              );
            }
            return null;
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
  );
}
