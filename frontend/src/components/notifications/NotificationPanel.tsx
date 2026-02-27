import React from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Bell } from "lucide-react";
import { Notification } from "../../backend";
import NotificationItem from "./NotificationItem";

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
}

export default function NotificationPanel({ notifications, onClose }: NotificationPanelProps) {
  const sorted = [...notifications].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="w-80 bg-white rounded-xl shadow-card-hover border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-poppins font-semibold text-sm text-foreground">Notifications</h3>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="py-10 text-center">
          <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-inter">No notifications yet</p>
        </div>
      ) : (
        <ScrollArea className="max-h-80">
          <div className="divide-y divide-border">
            {sorted.map((n, i) => (
              <NotificationItem key={i} notification={n} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
