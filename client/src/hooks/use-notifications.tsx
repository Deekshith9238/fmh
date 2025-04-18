import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export type Notification = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "task_request" | "service_request" | "message" | "review" | "system";
  read: boolean;
  createdAt: string;
  relatedId?: number;
  relatedType?: string;
};

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
};

export const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data, isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(notification => !notification.read).length);
    }
  }, [data]);

  const fetchNotifications = async () => {
    if (!user) return;
    await refetch();
  };

  const markAsRead = async (id: number) => {
    if (!user) return;
    
    try {
      await apiRequest("PATCH", `/api/notifications/${id}`, { read: true });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Recalculate unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await apiRequest("PATCH", "/api/notifications/mark-all-read", {});
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}