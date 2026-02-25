import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/components/ui/sidebar';
import { useGetMyNotifications, useMarkNotificationsRead } from '../hooks/useQueries';
import { Notification, Variant_roleAssigned_eventCreated_tenureSwitched_accountApproved_announcementPublished_eventReminder as NotifType } from '../backend';

const notifTypeLabels: Record<string, string> = {
  accountApproved: '✅ Account Approved',
  announcementPublished: '📢 Announcement',
  eventCreated: '📅 New Event',
  eventReminder: '⏰ Event Reminder',
  roleAssigned: '🎖️ Role Assigned',
  tenureSwitched: '🔄 Tenure Update',
};

export default function AppHeader() {
  const { toggleSidebar } = useSidebar();
  const { data: notifications = [] } = useGetMyNotifications();
  const markRead = useMarkNotificationsRead();

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const handleOpenNotifications = () => {
    if (unreadCount > 0) {
      markRead.mutate();
    }
  };

  const formatTime = (timestamp: bigint) => {
    const ms = Number(timestamp) / 1_000_000;
    const date = new Date(ms);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 md:hidden">
          <img
            src="/assets/generated/logo-mark.dim_256x256.png"
            alt="Chapter Hub"
            className="w-6 h-6 rounded-lg"
          />
          <span className="font-bold text-sm font-display">Chapter Hub</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu onOpenChange={(open) => open && handleOpenNotifications()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              [...notifications]
                .reverse()
                .slice(0, 20)
                .map((notif: Notification, idx: number) => (
                  <DropdownMenuItem
                    key={idx}
                    className={`flex flex-col items-start gap-1 py-3 cursor-default ${
                      !notif.isRead ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-xs font-medium text-foreground">
                        {notifTypeLabels[notif.notificationType] || notif.notificationType}
                      </span>
                      {!notif.isRead && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatTime(notif.timestamp)}
                    </span>
                  </DropdownMenuItem>
                ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
