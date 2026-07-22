import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Project, ProjectColor } from "./types";

export const projectsQueryOptions = queryOptions({
  queryKey: ["projects"],
  queryFn: () => api.get<Project[]>("/v1/projects"),
});

// Inline edits (rename, recolor, reorder) patch the cache optimistically so the
// board feels local-first; the server state is reconciled on settle.
function useOptimisticProjects<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
  patch: (projects: Project[], input: TInput) => Project[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (input: TInput) => {
      await qc.cancelQueries({ queryKey: ["projects"] });
      const previous = qc.getQueryData<Project[]>(["projects"]);
      if (previous) qc.setQueryData(["projects"], patch(previous, input));
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) qc.setQueryData(["projects"], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<Project>("/v1/projects", { project: { name } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  return useOptimisticProjects(
    ({ id, changes }: { id: string; changes: { name?: string; color?: ProjectColor } }) =>
      api.patch<Project>(`/v1/projects/${id}`, { project: changes }),
    (projects, { id, changes }) => projects.map((p) => (p.id === id ? { ...p, ...changes } : p)),
  );
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const mutation = useOptimisticProjects(
    (id: string) => api.delete<void>(`/v1/projects/${id}`),
    (projects, id) => projects.filter((p) => p.id !== id),
  );
  return {
    ...mutation,
    mutate: (id: string) =>
      mutation.mutate(id, {
        onSuccess: () => {
          // Items of the deleted project are gone server-side too.
          qc.invalidateQueries({ queryKey: ["items"] });
        },
      }),
  };
}

export function useReorderProjects() {
  return useOptimisticProjects(
    (orderedIds: string[]) => api.post<void>("/v1/projects/reorder", { ids: orderedIds }),
    (projects, orderedIds) =>
      [...projects].sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)),
  );
}
