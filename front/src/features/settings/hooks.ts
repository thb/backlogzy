import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { meQueryOptions, type User } from "@/lib/auth";

interface ProfileSubmit {
  name: string;
  email: string;
  file: File | null;
  removeAvatar: boolean;
}

// Update name/email/avatar. Uploads the avatar to S3 first; removed avatar sends null.
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, email, file, removeAvatar }: ProfileSubmit) => {
      const avatar_key = file ? await uploadFile(file) : undefined;
      const user: Record<string, unknown> = { name, email };
      if (avatar_key !== undefined) user.avatar_key = avatar_key;
      else if (removeAvatar) user.avatar_key = null;
      return api.patch<User>("/v1/auth/me", { user });
    },
    onSuccess: (updated) => qc.setQueryData(meQueryOptions.queryKey, updated),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { current_password: string; password: string }) =>
      api.patch("/v1/auth/password", input),
  });
}
