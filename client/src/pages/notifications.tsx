import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/loading-spinner";
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Info, Truck } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest("PUT", `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_confirmed":
        return <CheckCircle className="text-green-500" size={20} />;
      case "order_dispatched":
        return <Truck className="text-blue-500" size={20} />;
      case "order_delivered":
        return <CheckCircle className="text-green-500" size={20} />;
      case "payment_confirmed":
        return <CheckCircle className="text-green-500" size={20} />;
      case "alert":
        return <AlertTriangle className="text-orange-500" size={20} />;
      default:
        return <Info className="text-gray-500" size={20} />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const notifications = (notificationsData as any)?.notifications || [];
  const unreadNotifications = notifications.filter((n: any) => !n.isRead);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="notifications-screen">
      <div className="flex items-center p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="mr-3"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <h2 className="text-lg font-medium" data-testid="page-title">
            Notifications
          </h2>
          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="mark-all-read-button"
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-600" data-testid="no-notifications-message">
                You're all caught up! Notifications about your orders and account will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification: any) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors ${
                  notification.isRead ? "bg-white" : "bg-blue-50 border-blue-200"
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsReadMutation.mutate(notification.id);
                  }
                  // Navigate to order if notification has orderId
                  if (notification.orderId) {
                    setLocation(`/track-order/${notification.orderId}`);
                  }
                }}
                data-testid={`notification-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${notification.isRead ? "text-gray-900" : "text-blue-900 font-medium"}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="text-xs text-gray-500" data-testid={`time-${notification.id}`}>
                            {getTimeAgo(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}