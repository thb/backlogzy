import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Kanban, CalendarDays, Settings, ShieldCheck } from "lucide-react";
import { meQueryOptions, currentMembership, isAdmin } from "@/lib/auth";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { SidebarNav, type NavItem } from "./SidebarNav";

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: user } = useSuspenseQuery(meQueryOptions);
  const account = currentMembership(user);

  const navItems: NavItem[] = [
    { to: "/board", label: "Board", icon: Kanban },
    { to: "/planning", label: "Planning", icon: CalendarDays },
    { to: "/settings", label: "Settings", icon: Settings },
    ...(isAdmin(user) ? [{ to: "/admin", label: "Members", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-screen bg-muted">
      <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6">
        <div className="flex items-center">
          <Link to="/board" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <span className="text-xl">🍅</span>
            Backlogzy
          </Link>
          {account && <span className="ml-3 text-sm text-gray-400">{account.name}</span>}
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <UserMenu />
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <aside className="w-64 flex-shrink-0 border-r border-border bg-white">
          <nav className="p-2">
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Menu
            </div>
            <SidebarNav items={navItems} />
          </nav>
        </aside>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
