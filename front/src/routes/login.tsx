import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Github } from "lucide-react";
import { login } from "@/lib/auth";
import { oauthUrl } from "@/lib/api";
import { FormError } from "@/components/FieldError";

const OAUTH_BTN = "flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: () => navigate({ to: "/board" }),
  });

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-6">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Sign in</h1>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            mutation.mutate({ email: String(fd.get("email")), password: String(fd.get("password")) });
          }}
        >
          <FormError mutation={mutation} />
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
          <button type="submit" disabled={mutation.isPending}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {mutation.isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-2">
          <a href={oauthUrl("google_oauth2")} className={OAUTH_BTN}>
            <span className="font-semibold text-[#4285F4]">G</span> Continue with Google
          </a>
          <a href={oauthUrl("github")} className={OAUTH_BTN}>
            <Github className="h-4 w-4" /> Continue with GitHub
          </a>
        </div>

        <p className="mt-4 text-center text-sm">
          <Link to="/forgot" className="text-primary hover:underline">Forgot password?</Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          No account? <Link to="/signup" className="text-primary hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
