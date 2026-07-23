import { createColumnHelper } from "@tanstack/react-table";
import type { Item, Status } from "./types";
import type { ItemChanges } from "./itemHooks";
import { EditableCell } from "./EditableCell";
import { StatusSelect } from "./StatusSelect";
import { HoursCell } from "./HoursCell";
import { EditableDateCell } from "./EditableDateCell";
import { RowActions } from "./RowActions";

export interface BoardColumnActions {
  onUpdateItem: (id: string, changes: ItemChanges) => void;
  onUpdateStatus: (id: string, status: Status) => void;
  onAddTaskAfter: (afterId: string) => void;
  onOpenDetail: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
}

const columnHelper = createColumnHelper<Item>();

export function buildBoardColumns(actions: BoardColumnActions) {
  const { onUpdateItem, onUpdateStatus, onAddTaskAfter, onOpenDetail, onRequestDelete, onArchive } = actions;
  return [
    columnHelper.display({
      id: "drag",
      header: "",
      size: 32,
      enableResizing: false,
      cell: () => null, // Rendered by BoardRow directly
    }),
    columnHelper.display({
      id: "description",
      header: "Description",
      size: 400,
      cell: ({ row }) => {
        const item = row.original;
        if (item.kind === "separator") {
          return (
            <EditableCell
              value={item.label}
              onChange={(label) => onUpdateItem(item.id, { label })}
              placeholder="Section name..."
              className="font-semibold text-gray-700 text-xs"
            />
          );
        }
        const hasNotes = !!item.notes;
        return (
          <div className="flex items-center group/desc">
            <EditableCell
              value={item.description}
              onChange={(description) => onUpdateItem(item.id, { description })}
              placeholder="Description..."
              className="flex-1 text-xs"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(item.id);
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
        );
      },
    }),
    columnHelper.display({
      id: "status",
      header: "Status",
      size: 100,
      cell: ({ row }) => {
        const item = row.original;
        if (item.kind === "separator") return null;
        return (
          <StatusSelect
            value={item.status}
            onChange={(status) => onUpdateStatus(item.id, status)}
          />
        );
      },
    }),
    columnHelper.display({
      id: "estimation",
      header: "Estim.",
      size: 70,
      cell: ({ row }) => {
        const item = row.original;
        if (item.kind === "separator") return null;
        return (
          <HoursCell
            value={item.estimation}
            onChange={(estimation) => onUpdateItem(item.id, { estimation })}
          />
        );
      },
    }),
    columnHelper.display({
      id: "time_spent",
      header: "Spent",
      size: 70,
      cell: ({ row }) => {
        const item = row.original;
        if (item.kind === "separator") return null;
        return (
          <HoursCell
            value={item.time_spent}
            onChange={(time_spent) => onUpdateItem(item.id, { time_spent })}
          />
        );
      },
    }),
    columnHelper.display({
      id: "planned_start",
      header: "Start",
      size: 110,
      cell: ({ row }) => {
        const item = row.original;
        if (item.kind === "separator") return null;
        return (
          <EditableDateCell
            value={item.planned_start}
            onChange={(planned_start) => {
              const changes: ItemChanges = { planned_start };
              if (planned_start) {
                if (!item.planned_end || item.planned_end < planned_start) {
                  changes.planned_end = planned_start;
                }
              }
              onUpdateItem(item.id, changes);
            }}
          />
        );
      },
    }),
    columnHelper.display({
      id: "planned_end",
      header: "End",
      size: 110,
      cell: ({ row }) => {
        const item = row.original;
        if (item.kind === "separator") return null;
        return (
          <EditableDateCell
            value={item.planned_end}
            onChange={(planned_end) => {
              const start = item.planned_start;
              if (planned_end && !start) {
                onUpdateItem(item.id, { planned_start: planned_end, planned_end });
              } else if (!planned_end && start) {
                onUpdateItem(item.id, { planned_end: start });
              } else if (planned_end && start && planned_end < start) {
                onUpdateItem(item.id, { planned_end: start });
              } else {
                onUpdateItem(item.id, { planned_end });
              }
            }}
          />
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      size: 64,
      enableResizing: false,
      cell: ({ row }) => (
        <RowActions
          item={row.original}
          onRequestDelete={onRequestDelete}
          onAddTaskAfter={onAddTaskAfter}
          onArchive={onArchive}
        />
      ),
    }),
  ];
}
