export type NotificationAction = "customer_created" | "customer_updated" | "member_added";

export interface AppNotification {
  id: string;
  action: NotificationAction;
  data: { message?: string; url?: string };
  notifiable_type: string | null;
  notifiable_id: string | null;
  actor_name: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationsPage {
  data: AppNotification[];
  meta: { count: number; page: number; limit: number; pages: number; unread_count: number };
}
