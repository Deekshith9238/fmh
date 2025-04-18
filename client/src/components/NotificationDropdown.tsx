import { useState, useEffect } from "react";
import { 
  Bell, 
  Check, 
  Loader2, 
  MessagesSquare, 
  StarIcon, 
  BriefcaseBusiness, 
  Trash2,
  CircleCheck,
  AlertCircle 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotifications, Notification } from "@/hooks/use-notifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function NotificationDropdown() {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  // Check for new notifications periodically
  useEffect(() => {
    if (user && open && unreadCount > 0) {
      // Auto mark as read when dropdown is opened
      markAllAsRead();
    }
  }, [open, user, unreadCount, markAllAsRead]);

  // Get notification icon based on type
  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case "task_request":
        return <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />;
      case "service_request":
        return <BriefcaseBusiness className="h-4 w-4 mr-2 flex-shrink-0" />;
      case "message":
        return <MessagesSquare className="h-4 w-4 mr-2 flex-shrink-0" />;
      case "review":
        return <StarIcon className="h-4 w-4 mr-2 flex-shrink-0" />;
      case "system":
        return <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />;
      default:
        return <Bell className="h-4 w-4 mr-2 flex-shrink-0" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 flex items-center justify-between">
          <h3 className="text-sm font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs" 
              onClick={markAllAsRead}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        
        <ScrollArea className="h-[280px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-accent transition-colors flex items-start text-sm ${
                    notification.read ? "opacity-70" : "font-medium bg-accent/30"
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    {getNotificationIcon(notification)}
                    <div>
                      <p className="text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No notifications
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}