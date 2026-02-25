import React, { useState } from 'react';
import { useGetMyNotifications, useMarkNotificationsRead } from '../../hooks/useQueries';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const { data: notifications = [] } = useGetMyNotifications();
  const markRead = useMarkNotificationsRead();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      markRead.mutate();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full w-9 h-9">
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-cosmic-deep text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-xl overflow-hidden">
        <NotificationPanel notifications={notifications} />
      </PopoverContent>
    </Popover>
  );
}
