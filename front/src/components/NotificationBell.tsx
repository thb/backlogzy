import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { notificationsQueryOptions, useMarkAllRead, useMarkRead } from "@/features/notifications/hooks";
import type { AppNotification } from "@/features/notifications/types";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const { data } = useQuery(notificationsQueryOptions);
  const navigate = useNavigate();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const items = data?.data ?? [];
  const unread = data?.meta.unread_count ?? 0;

  function open(notification: AppNotification) {
    if (!notification.read) markRead.mutate(notification.id);
    const to = notification.data.url;
    if (to) navigate({ to } as Parameters<typeof navigate>[0]);
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Open notifications"
          className="relative rounded-full p-2 text-gray-500 outline-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-lg border border-border bg-white p-1.5 shadow-lg"
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-sm font-medium text-gray-900">Notifications</p>
            {unread > 0 && (
              <button onClick={() => markAll.mutate()} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          {items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-gray-400">No notifications yet</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {items.map((notification) => (
                <DropdownMenu.Item
                  key={notification.id}
                  onSelect={() => open(notification)}
                  className="flex cursor-pointer gap-2 rounded-md px-2 py-2 text-sm outline-none data-[highlighted]:bg-gray-100"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${notification.read ? "bg-transparent" : "bg-primary"}`}
                  />
                  <span className="flex-1">
                    <span className="block text-gray-800">{notification.data.message ?? notification.action}</span>
                    <span className="block text-xs text-gray-400">{timeAgo(notification.created_at)}</span>
                  </span>
                </DropdownMenu.Item>
              ))}
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
