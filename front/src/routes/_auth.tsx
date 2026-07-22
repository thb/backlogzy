import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { meQueryOptions } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/_auth")({
  // Guard on server state (the `me` query), never on token presence.
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(meQueryOptions);
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
