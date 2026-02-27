import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useGetMyNotifications, useMarkNotificationsRead } from "../../hooks/useQueries";
import NotificationPanel from "./NotificationPanel";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useGetMyNotifications();
  const markRead = useMarkNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpen = () => {
    setOpen((prev) => {
      if (!prev && unreadCount > 0) {
        markRead.mutate();
      }
      return !prev;
    });
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-primary-50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full gradient-primary text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50">
            <NotificationPanel notifications={notifications} onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
