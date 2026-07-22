import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api, tokens } from "@/lib/api";
import { meQueryOptions, type User } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FieldError";

const searchSchema = z.object({ token: z.string().optional().default("") });

interface Preview {
  email: string;
  role: string;
  account: string;
  needs_password: boolean;
}
interface AcceptResponse {
  existing: boolean;
  user?: User;
  access_token?: string;
  refresh_token?: string;
}

export const Route = createFileRoute("/invitations/accept")({
  component: AcceptPage,
  validateSearch: searchSchema,
});

function AcceptPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const preview = useQuery({
    queryKey: ["invitation-preview", token],
    queryFn: () => api.get<Preview>("/v1/invitations/accept", { token }),
    retry: false,
    enabled: token.length > 0,
  });

  const accept = useMutation({
    mutationFn: (body: { name?: string; password?: string }) =>
      api.post<AcceptResponse>("/v1/invitations/accept", { token, ...body }),
    onSuccess: (data) => {
      if (!data.existing && data.access_token && data.refresh_token && data.user) {
        tokens.set(data.access_token, data.refresh_token);
        tokens.setAccount(data.user.accounts[0].slug);
        queryClient.setQueryData(meQueryOptions.queryKey, data.user);
        navigate({ to: "/board" });
      } else {
        navigate({ to: "/login" }); // existing user → sign in to access the account
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-6">
        {preview.isLoading ? (
          <p className="text-center text-sm text-gray-500">Loading…</p>
        ) : preview.isError || !preview.data ? (
          <>
            <h1 className="mb-2 text-center text-xl font-bold text-gray-900">Invitation not found</h1>
            <p className="text-center text-sm text-gray-500">This invitation is invalid or has expired.</p>
            <p className="mt-4 text-center text-sm"><Link to="/login" className="text-primary hover:underline">Go to sign in</Link></p>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-center text-xl font-bold text-gray-900">Join {preview.data.account}</h1>
            <p className="mb-6 text-center text-sm text-gray-500">
              {preview.data.email} · as <span className="font-medium">{preview.data.role}</span>
            </p>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                accept.mutate({ name: String(fd.get("name") ?? ""), password: String(fd.get("password") ?? "") });
              }}
            >
              <FormError mutation={accept} />
              {preview.data.needs_password && (
                <>
                  <Field label="Your name" name="name" mutation={accept} autoComplete="name" required />
                  <Field label="Choose a password" name="password" type="password" mutation={accept} autoComplete="new-password" required />
                </>
              )}
              <button
                type="submit" disabled={accept.isPending}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {accept.isPending ? "Joining…" : "Accept invitation"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
