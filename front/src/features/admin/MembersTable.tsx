import { useSuspenseQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/Avatar";
import { FormError } from "@/components/FieldError";
import { membersQueryOptions, useUpdateMemberRole, useRemoveMember, ROLES } from "./hooks";

export function MembersTable() {
  const { data: members } = useSuspenseQuery(membersQueryOptions);
  const updateRole = useUpdateMemberRole();
  const remove = useRemoveMember();

  return (
    <div>
      <FormError mutation={updateRole} />
      <FormError mutation={remove} />

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-gray-400">
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.user.name} src={m.user.avatar_url} size={28} />
                    <div>
                      <div className="font-medium text-gray-900">{m.user.name}</div>
                      <div className="text-xs text-gray-500">{m.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={m.role}
                    onChange={(e) => updateRole.mutate({ id: m.id, role: e.target.value })}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => window.confirm(`Remove ${m.user.name}?`) && remove.mutate(m.id)}
                    className="text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
