import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { meQueryOptions } from "@/lib/auth";

export const Route = createFileRoute("/_auth")({
  // Guard on server state (the `me` query), never on token presence.
  // Layout is per-page: board/planning are full-screen, settings/admin use AppLayout.
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(meQueryOptions);
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: Outlet,
});
