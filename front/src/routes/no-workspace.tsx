import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { createWorkspace, logout } from "@/lib/auth";
import { FormError, FieldError } from "@/components/FieldError";

export const Route = createFileRoute("/no-workspace")({
  component: NoWorkspacePage,
});

function NoWorkspacePage() {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => navigate({ to: "/board" }),
  });

  async function signOut() {
    await logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-6">
        <h1 className="mb-1 text-center text-2xl font-bold text-gray-900">Create your workspace</h1>
        <p className="mb-6 text-center text-sm text-gray-500">You're signed in — name your workspace to get started.</p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            mutation.mutate(String(fd.get("workspace")));
          }}
        >
          <FormError mutation={mutation} />
          <div>
            <label htmlFor="workspace" className="mb-1 block text-sm font-medium text-gray-700">Workspace name</label>
            <input id="workspace" name="workspace" required autoComplete="organization"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30" />
            <FieldError mutation={mutation} field="workspace" />
          </div>
          <button type="submit" disabled={mutation.isPending}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {mutation.isPending ? "Creating…" : "Create workspace"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <button type="button" onClick={signOut} className="text-gray-500 hover:underline">Sign out</button>
        </p>
      </div>
    </div>
  );
}
