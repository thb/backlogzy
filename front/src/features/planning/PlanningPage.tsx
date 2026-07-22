import { useMemo } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TopBar } from "@/features/backlog/TopBar";
import { DetailPanel } from "@/features/backlog/DetailPanel";
import { statusChangePatch } from "@/features/backlog/statusChangePatch";
import { itemsQueryOptions, useCreateItem, useUpdateItem } from "@/features/backlog/itemHooks";
import { projectsQueryOptions } from "@/features/backlog/projectHooks";
import type { Status, Task } from "@/features/backlog/types";
import { addDays, getDaysInRange, getMonday, toDateStr } from "@/lib/dates";
import {
  habitsQueryOptions,
  pomodorosQueryOptions,
  useAddPomodoro,
  useRemovePomodoro,
  useToggleHabit,
} from "./trackingHooks";
import { PlanningGrid } from "./PlanningGrid";

const route = getRouteApi("/_auth/planning");

export function PlanningPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();

  const start = search.start ?? toDateStr(getMonday(new Date()));
  const startDate = useMemo(() => new Date(start + "T00:00:00"), [start]);
  const dates = useMemo(() => getDaysInRange(startDate, 7), [startDate]);

  const { data: projects } = useSuspenseQuery(projectsQueryOptions);
  const { data: items } = useSuspenseQuery(itemsQueryOptions({ kind: "task" }));
  const { data: habitEntries } = useSuspenseQuery(habitsQueryOptions(dates[0], dates[6]));
  const { data: pomodoroDays } = useSuspenseQuery(pomodorosQueryOptions(dates[0], dates[6]));

  const tasks = useMemo(() => items.filter((i): i is Task => i.kind === "task"), [items]);

  // Derive per-day trackers from the fetched range
  const pomodorosByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of pomodoroDays) map[p.date] = p.count;
    return map;
  }, [pomodoroDays]);

  const habitsByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const h of habitEntries) (map[h.date] ??= []).push(h.emoji);
    return map;
  }, [habitEntries]);

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const addPomodoro = useAddPomodoro();
  const removePomodoro = useRemovePomodoro();
  const toggleHabit = useToggleHabit();

  function setStart(value: string) {
    void navigate({ search: (prev) => ({ ...prev, start: value }) });
  }

  function openDetail(id: string) {
    void navigate({ search: (prev) => ({ ...prev, detail: id }) });
  }

  function handleAssignTask(taskId: string, date: string) {
    const t = tasks.find((task) => task.id === taskId);
    if (!t) return;
    const changes: { planned_start: string; planned_end?: string } = { planned_start: date };
    if (!t.planned_end || t.planned_end < date) changes.planned_end = date;
    updateItem.mutate({ id: taskId, changes });
  }

  function handleCreateTask(project_id: string, description: string, date: string) {
    createItem.mutate({
      project_id,
      kind: "task",
      description,
      status: "TODO",
      planned_start: date,
      planned_end: date,
      position: Date.now(),
    });
  }

  function handleMoveTask(taskId: string, date: string, project_id: string) {
    const t = tasks.find((task) => task.id === taskId);
    if (!t) return;
    // Shift range if multi-day, otherwise just set single day
    if (t.planned_start && t.planned_end && t.planned_end > t.planned_start) {
      const days = (Date.parse(t.planned_end) - Date.parse(t.planned_start)) / 86400000;
      const planned_end = toDateStr(addDays(new Date(date + "T00:00:00"), days));
      updateItem.mutate({ id: taskId, changes: { planned_start: date, planned_end, project_id } });
    } else {
      updateItem.mutate({
        id: taskId,
        changes: { planned_start: date, planned_end: date, project_id },
      });
    }
  }

  function handleUpdateStatus(id: string, status: Status) {
    const t = tasks.find((task) => task.id === id);
    if (!t) return;
    updateItem.mutate({ id, changes: statusChangePatch(t, status) });
  }

  const detailTask = search.detail ? tasks.find((t) => t.id === search.detail) : undefined;

  const weekEndDate = addDays(startDate, 6);
  const fmtRange = `${startDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — ${weekEndDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="h-screen flex flex-col bg-white">
      <TopBar />

      {/* Week navigation */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 border-b border-gray-200 bg-white">
        <button
          onClick={() => setStart(toDateStr(addDays(startDate, -7)))}
          className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          ← prev
        </button>
        <button
          onClick={() => setStart(toDateStr(getMonday(new Date())))}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
        >
          {fmtRange}
        </button>
        <button
          onClick={() => setStart(toDateStr(addDays(startDate, 7)))}
          className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          next →
        </button>
      </div>

      <PlanningGrid
        projects={projects}
        tasks={tasks}
        dates={dates}
        pomodorosByDate={pomodorosByDate}
        habitsByDate={habitsByDate}
        onOpenDetail={openDetail}
        onAssignTask={handleAssignTask}
        onCreateTask={handleCreateTask}
        onMoveTask={handleMoveTask}
        onAddPomodoro={(date) => addPomodoro.mutate(date)}
        onRemovePomodoro={(date) => removePomodoro.mutate(date)}
        onToggleHabit={(date, emoji) => toggleHabit.mutate({ date, emoji })}
      />

      {detailTask && (
        <DetailPanel
          task={detailTask}
          onUpdate={(id, changes) => updateItem.mutate({ id, changes })}
          onUpdateStatus={handleUpdateStatus}
          onClose={() => void navigate({ search: (prev) => ({ ...prev, detail: undefined }) })}
        />
      )}
    </div>
  );
}
