import { useDraggable } from "@dnd-kit/core";
import type { Task } from "@/features/backlog/types";
import { STATUS_CONFIG } from "@/features/backlog/types";
import { formatDuration } from "@/lib/duration";

/** Static chip (used in DragOverlay + non-draggable contexts) */
export function TaskChipContent({ task }: { task: Task }) {
  const cfg = STATUS_CONFIG[task.status];
  return (
    <div className="w-full text-left px-1.5 py-1 rounded text-xs flex items-start gap-1.5 min-w-0 bg-white">
      <span className={`shrink-0 w-2.5 h-2.5 rounded-full mt-0.5 ${cfg.dot}`} />
      <span className="flex-1 text-gray-700 break-words whitespace-normal">
        {task.description || "Untitled"}
      </span>
      {task.estimation != null && (
        <span className="shrink-0 text-gray-400 mt-0.5">{formatDuration(task.estimation)}</span>
      )}
    </div>
  );
}

/** Draggable task chip */
export function DraggableTaskChip({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full text-left px-1.5 py-1 rounded text-xs hover:bg-yellow-50 cursor-pointer flex items-start gap-1.5 min-w-0 ${isDragging ? "opacity-30" : ""}`}
    >
      <span
        className={`shrink-0 w-2.5 h-2.5 rounded-full mt-0.5 ${STATUS_CONFIG[task.status].dot}`}
      />
      <span className="flex-1 text-gray-700 break-words whitespace-normal">
        {task.description || "Untitled"}
      </span>
      {task.estimation != null && (
        <span className="shrink-0 text-gray-400 mt-0.5">{formatDuration(task.estimation)}</span>
      )}
    </button>
  );
}
