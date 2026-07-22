import { createFileRoute } from "@tanstack/react-router";
import { ProfileForm } from "@/features/settings/ProfileForm";
import { ChangePasswordForm } from "@/features/settings/ChangePasswordForm";
import { ImportSection } from "@/features/settings/ImportSection";

export const Route = createFileRoute("/_auth/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="mb-8 text-lg font-semibold text-gray-900">Settings</h1>

      <div className="max-w-lg space-y-10">
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Profile</h2>
          <ProfileForm />
        </section>

        <section className="border-t border-border pt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Change password</h2>
          <ChangePasswordForm />
        </section>

        <section className="border-t border-border pt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Import legacy backup</h2>
          <ImportSection />
        </section>
      </div>
    </div>
  );
}
