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
}: {
  row: Row<Item>;
  columnCount: number;
  onRequestDelete: (id: string) => void;
  onAddTaskAfter: (afterId: string) => void;
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
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
