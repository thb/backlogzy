import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FormError } from "@/components/FieldError";

export const Route = createFileRoute("/forgot")({
  component: ForgotPage,
});

function ForgotPage() {
  const mutation = useMutation({
    mutationFn: (email: string) => api.post("/v1/auth/password/forgot", { email }),
  });

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-6">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Reset password</h1>

        {mutation.isSuccess ? (
          <p className="mt-4 text-center text-sm text-gray-600">
            If an account exists for that email, a reset link is on its way.
          </p>
        ) : (
          <>
            <p className="mb-6 text-center text-sm text-gray-500">We'll email you a link to choose a new password.</p>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                mutation.mutate(String(fd.get("email") ?? ""));
              }}
            >
              <FormError mutation={mutation} />
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email" name="email" type="email" required autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <button
                type="submit" disabled={mutation.isPending}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {mutation.isPending ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
