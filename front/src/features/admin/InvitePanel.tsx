import { useSuspenseQuery } from "@tanstack/react-query";
import { FieldError, FormError } from "@/components/FieldError";
import { invitationsQueryOptions, useInvite, useResendInvitation, useRevokeInvitation, ROLES } from "./hooks";

export function InvitePanel() {
  const { data: invitations } = useSuspenseQuery(invitationsQueryOptions);
  const invite = useInvite();
  const resend = useResendInvitation();
  const revoke = useRevokeInvitation();

  return (
    <div className="space-y-6">
      <form
        className="flex items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          invite.mutate(
            { email: String(fd.get("email") ?? ""), role: String(fd.get("role") ?? "member") },
            { onSuccess: () => form.reset() },
          );
        }}
      >
        <div className="flex-1">
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Invite by email</label>
          <input
            id="email" name="email" type="email" required placeholder="person@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <select name="role" defaultValue="member" className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          type="submit" disabled={invite.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {invite.isPending ? "Inviting…" : "Invite"}
        </button>
      </form>
      <FieldError mutation={invite} field="email" />
      <FormError mutation={invite} />

      {invitations.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Pending invitations</h3>
          <ul className="divide-y divide-border rounded-lg border border-border bg-white">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>
                  <span className="font-medium text-gray-900">{inv.email}</span>
                  <span className="text-gray-400"> · {inv.role}</span>
                </span>
                <span className="flex items-center gap-3">
                  {resend.isSuccess && resend.variables === inv.id ? (
                    <span className="text-xs text-green-600">Sent ✓</span>
                  ) : (
                    <button type="button" onClick={() => resend.mutate(inv.id)} disabled={resend.isPending} className="text-primary hover:underline disabled:opacity-50">
                      Resend
                    </button>
                  )}
                  <button type="button" onClick={() => revoke.mutate(inv.id)} className="text-destructive hover:underline">
                    Revoke
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
