import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { meQueryOptions, currentMembership } from "@/lib/auth";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";

const TAB = "px-3 py-1.5 text-sm rounded-t-md border border-b-0 cursor-pointer border-transparent text-gray-400 hover:text-gray-600";
const TAB_ACTIVE = "px-3 py-1.5 text-sm rounded-t-md border border-b-0 cursor-pointer border-gray-200 bg-white text-gray-900 font-medium";

// Full-width app bar for the board/planning screens: view switch on the left,
// per-view content (project tabs…) in the middle, account controls on the right.
export function TopBar({ children }: { children?: ReactNode }) {
  const { data: user } = useSuspenseQuery(meQueryOptions);
  const account = currentMembership(user);

  return (
    <header className="flex items-center border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-3 shrink-0">
        <Link to="/board" className="text-xl" aria-label="Backlogzy">🍅</Link>
        {account && <span className="text-sm text-gray-400">{account.name}</span>}
      </div>

      <div className="flex items-center gap-0 pt-2 shrink-0">
        <Link to="/planning" className={TAB} activeProps={{ className: TAB_ACTIVE }}>
          Planning
        </Link>
        <Link to="/board" className={TAB} activeProps={{ className: TAB_ACTIVE }}>
          Boards
        </Link>
      </div>

      <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />

      {children ?? <div className="flex-1" />}

      <div className="flex items-center gap-1 px-3 shrink-0">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
