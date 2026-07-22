import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NotificationsPage } from "./types";

// Polled in-app feed (no websockets — consistent with the no-Action-Cable stack).
export const notificationsQueryOptions = queryOptions({
  queryKey: ["notifications"],
  queryFn: () => api.get<NotificationsPage>("/v1/notifications"),
  refetchInterval: 45_000,
});

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<void>(`/v1/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("/v1/notifications/read_all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
