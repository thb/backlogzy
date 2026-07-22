import { createFileRoute, redirect } from "@tanstack/react-router";
import { meQueryOptions, isAdmin } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import { InvitePanel } from "@/features/admin/InvitePanel";
import { MembersTable } from "@/features/admin/MembersTable";

export const Route = createFileRoute("/_auth/admin")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(meQueryOptions);
    if (!isAdmin(user)) throw redirect({ to: "/board" });
  },
  component: () => (
    <AppLayout>
      <AdminPage />
    </AppLayout>
  ),
});

function AdminPage() {
  return (
    <div className="p-6">
      <h1 className="mb-8 text-lg font-semibold text-gray-900">Admin · Members</h1>

      <div className="max-w-2xl space-y-10">
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Invite a member</h2>
          <InvitePanel />
        </section>

        <section className="border-t border-border pt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Members</h2>
          <MembersTable />
        </section>
      </div>
    </div>
  );
}
