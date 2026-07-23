import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Item } from "./types";

export interface ItemsParams {
  project_id?: string;
  kind?: "task" | "separator";
  with_archived?: boolean;
}

export const itemsQueryOptions = (params: ItemsParams) =>
  queryOptions({
    queryKey: ["items", params],
    queryFn: () => api.get<Item[]>("/v1/items", params as Record<string, unknown>),
  });

export type ItemChanges = Partial<
  Pick<
    Item,
    | "project_id"
    | "description"
    | "label"
    | "status"
    | "estimation"
    | "time_spent"
    | "notes"
    | "planned_start"
    | "planned_end"
    | "completed_at"
    | "position"
  >
>;

// Every board/planning cache entry lives under the ["items"] prefix; inline edits
// patch them all optimistically so the UI feels local-first, then reconcile.
function useOptimisticItems<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
  patch: (items: Item[], input: TInput) => Item[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (input: TInput) => {
      await qc.cancelQueries({ queryKey: ["items"] });
      const previous = qc.getQueriesData<Item[]>({ queryKey: ["items"] });
      qc.setQueriesData<Item[]>({ queryKey: ["items"] }, (old) => (old ? patch(old, input) : old));
      return { previous };
    },
    onError: (_err, _input, context) => {
      context?.previous?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ItemChanges & { project_id: string; kind: "task" | "separator" }) =>
      api.post<Item>("/v1/items", { item: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useUpdateItem() {
  return useOptimisticItems(
    ({ id, changes }: { id: string; changes: ItemChanges }) =>
      api.patch<Item>(`/v1/items/${id}`, { item: changes }),
    (items, { id, changes }) => items.map((i) => (i.id === id ? { ...i, ...changes } : i)),
  );
}

export function useDeleteItem() {
  return useOptimisticItems(
    (id: string) => api.delete<void>(`/v1/items/${id}`),
    (items, id) => items.filter((i) => i.id !== id),
  );
}

export function useReorderItems() {
  return useOptimisticItems(
    (orderedIds: string[]) => api.post<void>("/v1/items/reorder", { ids: orderedIds }),
    (items, orderedIds) =>
      items.map((i) => {
        const index = orderedIds.indexOf(i.id);
        return index === -1 ? i : { ...i, position: index + 1 };
      }),
  );
}

// Bulk archive/unarchive (a whole section block in one call). Optimistic:
// stamped in every cache; caches that exclude archived drop the rows too.
export function useArchiveItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, archived }: { ids: string[]; archived: boolean }) =>
      api.post<void>("/v1/items/archive", { ids, archived }),
    onMutate: async ({ ids, archived }) => {
      await qc.cancelQueries({ queryKey: ["items"] });
      const previous = qc.getQueriesData<Item[]>({ queryKey: ["items"] });
      const stamp = archived ? new Date().toISOString() : null;
      for (const [key] of previous) {
        const params = key[1] as ItemsParams | undefined;
        qc.setQueryData<Item[]>(key, (old) => {
          if (!old) return old;
          const next = old.map((i) => (ids.includes(i.id) ? { ...i, archived_at: stamp } : i));
          return params?.with_archived ? next : next.filter((i) => !i.archived_at);
        });
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      context?.previous?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
