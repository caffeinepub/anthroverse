import React from "react";
import {
  Bell, CheckCircle, Calendar, Star, Users, RefreshCw, Clock
} from "lucide-react";
import { Notification, Variant_roleAssigned_eventCreated_tenureSwitched_accountApproved_announcementPublished_eventReminder as NotifType } from "../../backend";
import { formatTimestamp } from "../../lib/utils";

interface NotificationItemProps {
  notification: Notification;
}

function getIcon(type: NotifType) {
  switch (type) {
    case NotifType.accountApproved: return <CheckCircle className="w-4 h-4 text-success" />;
    case NotifType.announcementPublished: return <Bell className="w-4 h-4 text-primary-500" />;
    case NotifType.eventCreated: return <Calendar className="w-4 h-4 text-accent-teal" />;
    case NotifType.eventReminder: return <Clock className="w-4 h-4 text-warning" />;
    case NotifType.roleAssigned: return <Star className="w-4 h-4 text-gold" />;
    case NotifType.tenureSwitched: return <RefreshCw className="w-4 h-4 text-secondary" />;
    default: return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  return (
    <div className={`px-4 py-3 flex gap-3 items-start ${!notification.isRead ? "bg-primary-50" : ""}`}>
      <div className="mt-0.5 flex-shrink-0">{getIcon(notification.notificationType)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-inter text-foreground leading-snug line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatTimestamp(notification.timestamp)}</p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
      )}
    </div>
  );
}
