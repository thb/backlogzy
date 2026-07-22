import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, LogOut, Settings } from "lucide-react";
import { meQueryOptions, logout } from "@/lib/auth";
import { tokens } from "@/lib/api";
import { Avatar } from "./Avatar";

const ITEM = "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 outline-none data-[highlighted]:bg-gray-100";

export function UserMenu() {
  const { data: user } = useSuspenseQuery(meQueryOptions);
  const navigate = useNavigate();
  const currentSlug = tokens.account();

  async function handleLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  function switchAccount(slug: string) {
    if (slug === currentSlug) return;
    tokens.setAccount(slug);
    // The account slug lives in localStorage (non-reactive), so invalidate+navigate
    // wouldn't reliably re-render the header/nav. A full reload re-inits every
    // account-scoped query AND the header with the new X-Account.
    window.location.assign("/board");
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button aria-label="Open user menu" className="rounded-full outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar name={user.name} src={user.avatar_url} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-60 rounded-lg border border-border bg-white p-1.5 shadow-lg">
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>

          {user.accounts.length > 1 && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Label className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Accounts
              </DropdownMenu.Label>
              {user.accounts.map((a) => (
                <DropdownMenu.Item key={a.id} className={ITEM} onSelect={() => switchAccount(a.slug)}>
                  <span className="flex-1 truncate">{a.name}</span>
                  {a.slug === currentSlug && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenu.Item>
              ))}
            </>
          )}

          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item className={ITEM} onSelect={() => navigate({ to: "/settings" })}>
            <Settings className="h-4 w-4 text-gray-400" />
            Settings
          </DropdownMenu.Item>
          <DropdownMenu.Item className={`${ITEM} text-destructive data-[highlighted]:bg-red-50`} onSelect={handleLogout}>
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
