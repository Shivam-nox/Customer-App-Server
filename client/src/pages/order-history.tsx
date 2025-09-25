import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import BottomNav from "@/components/bottom-nav";
import LoadingSpinner from "@/components/loading-spinner";
import { ArrowLeft, Download, RefreshCw, Filter, Eye } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

type FilterType = "all" | "delivered" | "pending" | "cancelled";

export default function OrderHistoryScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: () => fetch("/api/orders?limit=50", {
      headers: { "x-user-id": user?.id || "" },
    }).then(res => res.json()),
    enabled: !!user,
  });

  // Track which orders are currently downloading invoices
  const [downloadingInvoices, setDownloadingInvoices] = useState<Set<string>>(new Set());

  const downloadInvoice = async (order: any) => {
    if (downloadingInvoices.has(order.id)) return; // Prevent duplicate downloads

    setDownloadingInvoices(prev => new Set(prev).add(order.id));
    
    try {
      const response = await fetch(`/api/orders/${order.id}/invoice`, {
        headers: { "x-user-id": user?.id || "" },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to download invoice");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `Invoice for order ${order.orderNumber} downloaded successfully`,
      });
    } catch (error: any) {
      console.error("Invoice download error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  };

  const handleReorder = () => {
    setLocation("/new-order");
    toast({
      title: "Redirecting to New Order",
      description: "You can place a new order with your preferred details",
    });
  };

  if (!user) return null;

  const orders = ordersData?.orders || [];
  const filteredOrders = orders.filter((order: any) => {
    if (filter === "all") return true;
    if (filter === "delivered") return order.status === "delivered";
    if (filter === "pending") return ["pending", "confirmed", "in_transit"].includes(order.status);
    if (filter === "cancelled") return order.status === "cancelled";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in_transit":
        return "bg-orange-100 text-orange-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filterButtons = [
    { key: "all", label: "All" },
    { key: "delivered", label: "Delivered" },
    { key: "pending", label: "Pending" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="order-history-screen">
      <div className="flex items-center p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/home")}
          className="mr-3"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-lg font-medium" data-testid="page-title">Order History</h2>
      </div>

      <div className="flex-1 pb-20">
        <div className="p-4">
          {/* Filter Options */}
          <div className="flex space-x-2 mb-4" data-testid="filter-buttons">
            {filterButtons.map((button) => (
              <Button
                key={button.key}
                variant={filter === button.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(button.key as FilterType)}
                className="rounded-full"
                data-testid={`filter-${button.key}`}
              >
                {button.label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order: any) => (
                <Card key={order.id} className="shadow-sm" data-testid={`order-card-${order.id}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-gray-800" data-testid={`order-number-${order.id}`}>
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-600" data-testid={`order-date-${order.id}`}>
                          {format(new Date(order.createdAt), "MMMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)} data-testid={`order-status-${order.id}`}>
                        {order.status.replace("_", " ").toLowerCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-3 text-sm">
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-medium" data-testid={`order-quantity-${order.id}`}>{order.quantity}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium" data-testid={`order-amount-${order.id}`}>
                          ₹{parseFloat(order.totalAmount).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Location:</span>
                        <span className="text-gray-600 text-right max-w-[60%] truncate" data-testid={`order-location-${order.id}`}>
                          {order.deliveryAddress}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      {order.status === "delivered" && (
                        <Button
                          onClick={() => downloadInvoice(order)}
                          disabled={downloadingInvoices.has(order.id)}
                          className="flex-1 bg-primary text-white text-sm font-medium ripple"
                          data-testid={`download-invoice-${order.id}`}
                        >
                          {downloadingInvoices.has(order.id) ? (
                            <LoadingSpinner />
                          ) : (
                            <>
                              <Download size={16} className="mr-1" />
                              Download Invoice
                            </>
                          )}
                        </Button>
                      )}
                      {order.status !== "delivered" && (
                        <Button
                          onClick={() => setLocation(`/track-order/${order.id}`)}
                          variant="ghost"
                          className="flex-1 text-sm font-medium ripple"
                          data-testid={`view-order-${order.id}`}
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </Button>
                      )}
                      <Button
                        onClick={handleReorder}
                        variant="outline"
                        className="flex-1 border-primary text-primary text-sm font-medium ripple"
                        data-testid={`reorder-${order.id}`}
                      >
                        <RefreshCw size={16} className="mr-1" />
                        Reorder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-sm" data-testid="no-orders-message">
              <CardContent className="p-8 text-center">
                <Filter size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-800 mb-2">No Orders Found</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {filter === "all" 
                    ? "You haven't placed any orders yet" 
                    : `No ${filter} orders found`
                  }
                </p>
                <Button
                  onClick={() => setLocation("/new-order")}
                  className="ripple"
                  data-testid="place-order-button"
                >
                  Place Your First Order
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BottomNav activeTab="orders" />
    </div>
  );
}
