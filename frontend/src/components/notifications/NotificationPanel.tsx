import React from 'react';
import type { Notification } from '../../backend';
import NotificationItem from './NotificationItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';

interface NotificationPanelProps {
  notifications: Notification[];
}

export default function NotificationPanel({ notifications }: NotificationPanelProps) {
  const sorted = [...notifications].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm">Notifications</h3>
        {notifications.length > 0 && (
          <span className="text-xs text-muted-foreground">{notifications.length} total</span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <Bell size={32} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <ScrollArea className="max-h-80">
          <div className="divide-y divide-border">
            {sorted.map((notification, idx) => (
              <NotificationItem key={idx} notification={notification} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
