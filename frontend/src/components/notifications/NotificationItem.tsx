import React from 'react';
import type { Notification } from '../../backend';
import { Variant_roleAssigned_eventCreated_tenureSwitched_accountApproved_announcementPublished_eventReminder as NotifType } from '../../backend';
import { formatRelativeTime } from '../../utils/time';
import { CheckCircle, Megaphone, Calendar, Clock, Shield, RefreshCw } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
}

function getNotifIcon(type: NotifType) {
  switch (type) {
    case NotifType.accountApproved: return { Icon: CheckCircle, color: 'text-green-500' };
    case NotifType.announcementPublished: return { Icon: Megaphone, color: 'text-blue-500' };
    case NotifType.eventCreated: return { Icon: Calendar, color: 'text-purple-500' };
    case NotifType.eventReminder: return { Icon: Clock, color: 'text-amber-500' };
    case NotifType.roleAssigned: return { Icon: Shield, color: 'text-cyan-500' };
    case NotifType.tenureSwitched: return { Icon: RefreshCw, color: 'text-orange-500' };
    default: return { Icon: CheckCircle, color: 'text-muted-foreground' };
  }
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const { Icon, color } = getNotifIcon(notification.notificationType);

  return (
    <div className={`flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${!notification.isRead ? 'bg-accent/5' : ''}`}>
      <div className={`mt-0.5 shrink-0 ${color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!notification.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatRelativeTime(notification.timestamp)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
      )}
    </div>
  );
}
