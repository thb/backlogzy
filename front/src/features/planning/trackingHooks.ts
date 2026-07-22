import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const HABIT_OPTIONS = [
  { emoji: "🧘‍♂️", label: "Méditation" },
  { emoji: "🏋️", label: "PPG" },
  { emoji: "📖", label: "Lecture" },
] as const;

interface HabitEntry {
  id: string;
  date: string;
  emoji: string;
}

interface PomodoroDay {
  id: string;
  date: string;
  count: number;
}

export const habitsQueryOptions = (from: string, to: string) =>
  queryOptions({
    queryKey: ["habits", from, to],
    queryFn: () => api.get<HabitEntry[]>("/v1/habit_entries", { from, to }),
  });

export const pomodorosQueryOptions = (from: string, to: string) =>
  queryOptions({
    queryKey: ["pomodoros", from, to],
    queryFn: () => api.get<PomodoroDay[]>("/v1/pomodoros", { from, to }),
  });

export function useToggleHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; emoji: string }) =>
      api.post<{ date: string; emoji: string; active: boolean }>("/v1/habit_entries/toggle", input),
    onMutate: async ({ date, emoji }) => {
      await qc.cancelQueries({ queryKey: ["habits"] });
      const previous = qc.getQueriesData<HabitEntry[]>({ queryKey: ["habits"] });
      qc.setQueriesData<HabitEntry[]>({ queryKey: ["habits"] }, (old) => {
        if (!old) return old;
        const existing = old.find((h) => h.date === date && h.emoji === emoji);
        if (existing) return old.filter((h) => h !== existing);
        return [...old, { id: `optimistic-${date}-${emoji}`, date, emoji }];
      });
      return { previous };
    },
    onError: (_err, _input, context) => {
      context?.previous?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

function usePomodoroMutation(path: string, delta: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => api.post<PomodoroDay | null>(path, { date }),
    onMutate: async (date) => {
      await qc.cancelQueries({ queryKey: ["pomodoros"] });
      const previous = qc.getQueriesData<PomodoroDay[]>({ queryKey: ["pomodoros"] });
      qc.setQueriesData<PomodoroDay[]>({ queryKey: ["pomodoros"] }, (old) => {
        if (!old) return old;
        const existing = old.find((p) => p.date === date);
        if (!existing && delta > 0) return [...old, { id: `optimistic-${date}`, date, count: 1 }];
        return old
          .map((p) => (p.date === date ? { ...p, count: p.count + delta } : p))
          .filter((p) => p.count > 0);
      });
      return { previous };
    },
    onError: (_err, _input, context) => {
      context?.previous?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["pomodoros"] });
    },
  });
}

export function useAddPomodoro() {
  return usePomodoroMutation("/v1/pomodoros/increment", 1);
}

export function useRemovePomodoro() {
  return usePomodoroMutation("/v1/pomodoros/decrement", -1);
}
