import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import BottomNav from "@/components/bottom-nav";
import LoadingSpinner from "@/components/loading-spinner";
import {
  Bell,
  Fuel,
  MapPin,
  Plus,
  TrendingUp,
  Eye,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import LocationSelector from "@/components/LocationSelector";
import logoUrl from "@assets/Final_Logo_with_Tagline_1755695309847.png";

export default function HomeScreen() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: () =>
      fetch("/api/orders", {
        headers: { "x-user-id": user?.id || "" },
      }).then((res) => res.json()),
  });

  const { data: notificationsData } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: () =>
      fetch("/api/notifications", {
        headers: { "x-user-id": user?.id || "" },
      }).then((res) => res.json()),
  });

  const orders = ordersData?.orders || [];
  const recentOrders = orders.slice(0, 3);
  const unreadCount = notificationsData?.unreadCount || 0;

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyOrders = orders.filter((order: any) => {
    const orderDate = new Date(order.createdAt);
    return (
      orderDate.getMonth() === currentMonth &&
      orderDate.getFullYear() === currentYear
    );
  });
  const monthlyLiters = monthlyOrders.reduce(
    (sum: number, order: any) => sum + order.quantity,
    0,
  );
  const totalSaved = monthlyOrders.length * 500; // Estimated savings

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in_transit":
        return "bg-orange-100 text-orange-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case "delivered":
        return "border-green-500";
      case "in_transit":
        return "border-orange-500";
      case "confirmed":
        return "border-blue-500";
      default:
        return "border-gray-500";
    }
  };

  if (!user) return null;

  return (
    <div
      className="min-h-screen flex flex-col bg-gray-50"
      data-testid="home-screen"
    >
      {/* Header */}
      <div className="zapygo-gradient text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <img 
              src={logoUrl} 
              alt="Zapygo - Fueling business, Driving progress" 
              className="h-12 w-auto"
              data-testid="company-logo"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-600 relative p-2"
            onClick={() => setLocation("/notifications")}
            data-testid="notifications-button"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center text-white"
                data-testid="notification-count"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div
            className="bg-blue-600 rounded-lg p-3"
            data-testid="monthly-stats"
          >
            <p className="text-blue-100 text-xs">This Month</p>
            <p className="text-xl font-bold" data-testid="monthly-liters">
              {monthlyLiters}L
            </p>
          </div>
          <div
            className="bg-blue-600 rounded-lg p-3"
            data-testid="savings-stats"
          >
            <p className="text-blue-100 text-xs">Total Saved</p>
            <p className="text-xl font-bold" data-testid="total-saved">
              ₹{totalSaved.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 pb-20">
        {/* Location Selection at top */}
        <div className="p-4 pb-0">
          <LocationSelector />
        </div>
        {/* KYC CTA Banner */}
        {user.kycStatus === "pending" && (
          <div className="p-4">
            <Card
              className="bg-orange-50 border-orange-200 shadow-sm"
              data-testid="kyc-cta-banner"
            >
              <CardContent className="p-4">
                <Button
                  onClick={() => setLocation("/kyc-upload")}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-4 h-auto ripple"
                  data-testid="kyc-home-cta"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <Shield size={24} />
                      <div className="text-left">
                        <p className="font-medium">Complete KYC Verification</p>
                        <p className="text-sm text-orange-100">
                          Required to place orders
                        </p>
                      </div>
                    </div>
                    <ArrowLeft className="rotate-180" size={20} />
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}



        {/* Quick Actions */}
        <div className="p-4">
          <h3
            className="font-bold text-lg mb-4"
            data-testid="quick-actions-title"
          >
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              onClick={() => setLocation("/new-order")}
              className="bg-secondary hover:bg-green-600 text-white rounded-lg p-6 h-auto flex-col ripple"
              data-testid="order-diesel-button"
            >
              <Fuel size={32} className="mb-2" />
              <span className="font-medium">Order Diesel</span>
            </Button>
            <Button
              onClick={() => setLocation("/track-order")}
              className="bg-accent hover:bg-orange-600 text-white rounded-lg p-6 h-auto flex-col ripple"
              data-testid="track-order-button"
            >
              <MapPin size={32} className="mb-2" />
              <span className="font-medium">Track Order</span>
            </Button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg" data-testid="recent-orders-title">
              Recent Orders
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/orders")}
              className="text-primary"
              data-testid="view-all-orders-button"
            >
              View All
            </Button>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4 mb-6">
              {recentOrders.map((order: any) => (
                <Card
                  key={order.id}
                  className={`shadow-sm border-l-4 ${getStatusBorder(order.status)}`}
                  data-testid={`order-${order.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p
                          className="font-medium text-gray-800"
                          data-testid={`order-number-${order.id}`}
                        >
                          Order #{order.orderNumber}
                        </p>
                        <p
                          className="text-sm text-gray-600"
                          data-testid={`order-date-${order.id}`}
                        >
                          {format(new Date(order.createdAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge
                        className={getStatusColor(order.status)}
                        data-testid={`order-status-${order.id}`}
                      >
                        {order.status.replace("_", " ").toLowerCase()}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p
                          className="text-sm text-gray-600"
                          data-testid={`order-quantity-${order.id}`}
                        >
                          Quantity: {order.quantity}L
                        </p>
                        <p
                          className="text-sm text-gray-600"
                          data-testid={`order-amount-${order.id}`}
                        >
                          Amount: ₹
                          {parseFloat(order.totalAmount).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setLocation(`/track-order/${order.id}`)
                          }
                          className="text-primary"
                          data-testid={`track-order-${order.id}`}
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </Button>
                        {order.status === "in_transit" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setLocation(`/track-order/${order.id}`)
                            }
                            className="text-primary border-primary"
                            data-testid={`live-track-${order.id}`}
                          >
                            <MapPin size={16} className="mr-1" />
                            Track
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-sm mb-6" data-testid="no-orders-card">
              <CardContent className="p-8 text-center">
                <Fuel size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-800 mb-2">
                  No Orders Yet
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Place your first diesel order to get started
                </p>
                <Button
                  onClick={() => setLocation("/new-order")}
                  className="ripple"
                  data-testid="first-order-button"
                >
                  <Plus size={16} className="mr-2" />
                  Order Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BottomNav activeTab="home" />
    </div>
  );
}
