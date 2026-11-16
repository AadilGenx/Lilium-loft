import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, ShoppingCart, AlertTriangle, CheckCircle2, CheckCheck } from 'lucide-react';
import { useUIStore } from '@/store';

export function NotificationDropdown() {
  const { notifications: allNotifications, markNotificationRead, markAllNotificationsRead } = useUIStore();
  // Stock problems have their own alert button; this bell is for orders and system messages.
  const notifications = allNotifications.filter((n) => n.type !== 'stock');
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (id: string, link?: string) => {
    markNotificationRead(id);
    if (link) {
      navigate(link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-emerald-600" />;
      case 'stock':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={8} className="w-80 max-w-[calc(100vw-1rem)] p-0">
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <div>
            <div className="text-sm font-semibold text-slate-800">Notifications</div>
            <div className="text-xs text-slate-500">
              {unreadCount} unread {unreadCount === 1 ? 'alert' : 'alerts'}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsRead()}
              className="text-xs text-red-600 hover:underline flex items-center gap-1 font-medium"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n.id, n.link)}
                className={`flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                  !n.read ? 'bg-red-50/30' : ''
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-full bg-slate-100 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs font-medium truncate ${
                        !n.read ? 'text-slate-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      {n.title}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="p-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-slate-600 hover:text-red-600 h-8"
            onClick={() => navigate('/orders')}
          >
            View all store activities
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

