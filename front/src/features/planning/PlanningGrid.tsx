import { useMemo, useState } from "react";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Project, Task } from "@/features/backlog/types";
import { PROJECT_COLORS } from "@/features/backlog/types";
import { useColumnSizing } from "./useColumnSizing";
import { GridTable } from "./GridTable";
import { TaskChipContent } from "./TaskChip";
import { DroppableProjectCell } from "./ProjectCell";
import { DayTrackerCell } from "./DayTrackerCell";

type DateRow = { date: string };

type CellTarget = { date: string; project_id: string } | null;

export interface PlanningGridProps {
  projects: Project[];
  tasks: Task[];
  dates: string[];
  pomodorosByDate: Record<string, number>;
  habitsByDate: Record<string, string[]>;
  onOpenDetail: (id: string) => void;
  onAssignTask: (taskId: string, date: string) => void;
  onCreateTask: (project_id: string, description: string, date: string) => void;
  onMoveTask: (taskId: string, date: string, project_id: string) => void;
  onAddPomodoro: (date: string) => void;
  onRemovePomodoro: (date: string) => void;
  onToggleHabit: (date: string, emoji: string) => void;
}

const columnHelper = createColumnHelper<DateRow>();

export function PlanningGrid(props: PlanningGridProps) {
  const { projects, tasks, dates } = props;
  const { columnSizing, setColumnSizing } = useColumnSizing("planning");
  const [pickerTarget, setPickerTarget] = useState<CellTarget>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const rows: DateRow[] = useMemo(() => dates.map((date) => ({ date })), [dates]);

  // Index tasks by date × project for O(1) lookups
  const taskIndex = useMemo(() => {
    const idx: Record<string, Record<string, Task[]>> = {};
    for (const d of dates) {
      idx[d] = {};
      for (const p of projects) idx[d][p.id] = [];
    }
    for (const t of tasks) {
      if (!t.planned_start) continue;
      const start = t.planned_start;
      const end = t.planned_end ?? t.planned_start;
      for (const d of dates) {
        if (d >= start && d <= end) {
          idx[d]?.[t.project_id]?.push(t);
        }
      }
    }
    return idx;
  }, [dates, projects, tasks]);

  // Sum estimations per date across all projects
  const estimByDate = useMemo(() => {
    const sums: Record<string, number> = {};
    for (const d of dates) {
      let total = 0;
      for (const p of projects) {
        for (const t of taskIndex[d]?.[p.id] ?? []) {
          if (t.estimation != null) total += t.estimation;
        }
      }
      sums[d] = total;
    }
    return sums;
  }, [dates, projects, taskIndex]);

  // Column id = project id → pastel background lookup (replaces columnDef.meta)
  const pastelByColId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects) {
      map[p.id] = (PROJECT_COLORS.find((c) => c.name === p.color) ?? PROJECT_COLORS[0]).pastel;
    }
    return map;
  }, [projects]);

  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setDraggedTask(task);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedTask(null);
    const { active, over } = event;
    if (!over) return;
    const task = active.data.current?.task as Task | undefined;
    if (!task) return;
    const dropData = over.data.current as { date: string; project_id: string } | undefined;
    if (!dropData) return;
    // Skip if same cell
    if (dropData.date === task.planned_start && dropData.project_id === task.project_id) return;
    props.onMoveTask(task.id, dropData.date, dropData.project_id);
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "date",
        header: "",
        size: 120,
        cell: ({ row }) => (
          <DayTrackerCell
            date={row.original.date}
            estimation={estimByDate[row.original.date] ?? 0}
            pomodoroCount={props.pomodorosByDate[row.original.date] ?? 0}
            habits={props.habitsByDate[row.original.date] ?? []}
            onAddPomodoro={props.onAddPomodoro}
            onRemovePomodoro={props.onRemovePomodoro}
            onToggleHabit={props.onToggleHabit}
          />
        ),
      }),
      ...projects.map((project) =>
        columnHelper.display({
          id: project.id,
          header: project.name,
          size: 200,
          cell: ({ row }) => {
            const date = row.original.date;
            const isPickerOpen =
              pickerTarget?.date === date && pickerTarget?.project_id === project.id;
            return (
              <DroppableProjectCell
                date={date}
                project_id={project.id}
                dayTasks={taskIndex[date]?.[project.id] ?? []}
                isPickerOpen={isPickerOpen}
                projectTasks={tasks.filter((t) => t.project_id === project.id)}
                onOpenDetail={props.onOpenDetail}
                onOpenPicker={() => setPickerTarget({ date, project_id: project.id })}
                onAssignTask={props.onAssignTask}
                onCreateTask={props.onCreateTask}
                onClosePicker={() => setPickerTarget(null)}
              />
            );
          },
        }),
      ),
    ],
    [projects, taskIndex, estimByDate, pickerTarget, tasks, props],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.date,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: { columnSizing },
    onColumnSizingChange: setColumnSizing,
  });

  return (
    <div className="flex-1 overflow-auto">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <GridTable table={table} pastelByColId={pastelByColId} />

        <DragOverlay dropAnimation={null}>
          {draggedTask && (
            <div className="opacity-80 shadow-md rounded w-48">
              <TaskChipContent task={draggedTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
