import { useDroppable } from "@dnd-kit/core";
import type { Task } from "@/features/backlog/types";
import { DraggableTaskChip } from "./TaskChip";
import { TaskPicker } from "./TaskPicker";

/** Droppable project cell */
export function DroppableProjectCell({
  date,
  project_id,
  dayTasks,
  isPickerOpen,
  projectTasks,
  onOpenDetail,
  onOpenPicker,
  onAssignTask,
  onCreateTask,
  onClosePicker,
}: {
  date: string;
  project_id: string;
  dayTasks: Task[];
  isPickerOpen: boolean;
  projectTasks: Task[];
  onOpenDetail: (id: string) => void;
  onOpenPicker: () => void;
  onAssignTask: (taskId: string, date: string) => void;
  onCreateTask: (project_id: string, desc: string, date: string) => void;
  onClosePicker: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${date}::${project_id}`,
    data: { date, project_id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-[28px] ${isPickerOpen ? "bg-yellow-50" : isOver ? "bg-yellow-50" : ""}`}
    >
      {dayTasks.length > 0 && (
        <div className="flex flex-col gap-0.5 py-0.5">
          {dayTasks.map((t) => (
            <DraggableTaskChip key={t.id} task={t} onClick={() => onOpenDetail(t.id)} />
          ))}
        </div>
      )}
      {!isPickerOpen && (
        <div
          onClick={onOpenPicker}
          className="min-h-[20px] cursor-pointer rounded hover:bg-yellow-50"
        />
      )}
      {isPickerOpen && (
        <TaskPicker
          projectTasks={projectTasks}
          onSelect={(taskId) => {
            onAssignTask(taskId, date);
            onClosePicker();
          }}
          onCreate={(desc) => {
            onCreateTask(project_id, desc, date);
            onClosePicker();
          }}
          onClose={onClosePicker}
        />
      )}
    </div>
  );
}
