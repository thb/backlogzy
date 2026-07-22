import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { FieldError, FormError } from "@/components/FieldError";

const searchSchema = z.object({ token: z.string().optional().default("") });

export const Route = createFileRoute("/reset")({
  component: ResetPage,
  validateSearch: searchSchema,
});

function ResetPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (password: string) => api.post("/v1/auth/password/reset", { token, password }),
    onSuccess: () => navigate({ to: "/login" }),
  });

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-6">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Choose a new password</h1>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            mutation.mutate(String(fd.get("password") ?? ""));
          }}
        >
          <FormError mutation={mutation} />
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">New password</label>
            <input
              id="password" name="password" type="password" required autoComplete="new-password" minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <FieldError mutation={mutation} field="password" />
          </div>
          <button
            type="submit" disabled={mutation.isPending}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? "Saving…" : "Reset password"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
