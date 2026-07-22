import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const ROLES = ["admin", "member"] as const;

export interface Member {
  id: string;
  role: string;
  active: boolean;
  user: { id: string; name: string; email: string; avatar_url: string | null };
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export const membersQueryOptions = queryOptions({
  queryKey: ["members"],
  queryFn: () => api.get<Member[]>("/v1/members"),
});

export const invitationsQueryOptions = queryOptions({
  queryKey: ["invitations"],
  queryFn: () => api.get<Invitation[]>("/v1/invitations"),
});

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.patch(`/v1/members/${id}`, { membership: { role } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/members/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: string }) => api.post("/v1/invitations", { invitation: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invitations"] }),
  });
}

export function useResendInvitation() {
  return useMutation({
    mutationFn: (id: string) => api.post(`/v1/invitations/${id}/resend`),
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/invitations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invitations"] }),
  });
}
