import { Archive, ArchiveRestore } from "lucide-react";
import type { Item } from "./types";

// Hover/focus-revealed row actions shared by task rows (via boardColumns) and
// separator rows (via BoardRow): delete, archive toggle, add task below.
export function RowActions({
  item,
  onRequestDelete,
  onAddTaskAfter,
  onArchive,
}: {
  item: Item;
  onRequestDelete: (id: string) => void;
  onAddTaskAfter: (afterId: string) => void;
  onArchive: (id: string, archived: boolean) => void;
}) {
  const archived = Boolean(item.archived_at);
  return (
    <div className="flex items-center justify-center opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 h-[28px]">
      <button
        onClick={() => onRequestDelete(item.id)}
        className="text-gray-300 hover:text-red-500 text-sm px-0.5 cursor-pointer"
        title={item.kind === "separator" ? "Delete separator" : "Delete"}
      >
        &times;
      </button>
      <button
        onClick={() => onArchive(item.id, !archived)}
        className="text-gray-300 hover:text-amber-600 px-0.5 cursor-pointer"
        title={archived ? "Unarchive" : "Archive"}
      >
        {archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
      </button>
      <button
        onClick={() => onAddTaskAfter(item.id)}
        className="text-gray-300 hover:text-blue-500 text-sm px-0.5 cursor-pointer"
        title="Add task below"
      >
        +
      </button>
    </div>
  );
}
