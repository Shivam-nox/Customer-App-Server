import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import LoadingSpinner from "@/components/loading-spinner";
import { ArrowLeft, MapPin, Phone, CheckCircle, Clock, Truck, Star } from "lucide-react";
import { format } from "date-fns";

export default function TrackOrderScreen() {
  const { orderId } = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/orders", orderId],
    queryFn: () => fetch(`/api/orders/${orderId}`, {
      headers: { "x-user-id": user?.id || "" },
    }).then(res => res.json()),
    enabled: !!orderId && !!user,
  });

  const updateLocationMutation = useMutation({
    mutationFn: async () => {
      // Simulate driver location update
      const response = await fetch(`/api/orders/${orderId}/update-driver-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: 19.0760 + (Math.random() - 0.5) * 0.01,
          longitude: 72.8777 + (Math.random() - 0.5) * 0.01,
        }),
      });
      return response.json();
    },
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data?.order) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex items-center p-4 border-b bg-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/home")}
            className="mr-3"
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-lg font-medium">Track Order</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Order not found or access denied</p>
              <Button 
                onClick={() => setLocation("/orders")} 
                className="mt-4"
              >
                View All Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { order, delivery } = data;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in_transit":
        return "bg-orange-100 text-orange-800";
      case "confirmed":
      case "fuel_loaded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressSteps = () => {
    const steps = [
      { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
      { key: "fuel_loaded", label: "Fuel Loaded", icon: CheckCircle },
      { key: "in_transit", label: "Out for Delivery", icon: Truck },
      { key: "delivered", label: "Delivered", icon: MapPin },
    ];

    const statusOrder = ["pending", "confirmed", "fuel_loaded", "in_transit", "delivered"];
    const currentStatusIndex = statusOrder.indexOf(order.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index < currentStatusIndex,
      current: index === currentStatusIndex,
      pending: index > currentStatusIndex,
    }));
  };

  const steps = getProgressSteps();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="track-order-screen">
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
        <h2 className="text-lg font-medium" data-testid="page-title">Track Order</h2>
      </div>

      {/* Mock GPS Map View */}
      <div className="h-64 bg-gradient-to-br from-blue-100 to-green-100 relative" data-testid="map-container">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 shadow-lg max-w-xs mx-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                {order.status === "in_transit" ? (
                  <p className="font-medium text-sm" data-testid="driver-eta">Driver is 5 minutes away</p>
                ) : order.status === "delivered" ? (
                  <p className="font-medium text-sm text-green-600" data-testid="delivery-complete">Order Delivered Successfully</p>
                ) : (
                  <p className="font-medium text-sm" data-testid="order-status-message">Preparing your order</p>
                )}
              </div>
            </div>
          </div>
        </div>
        {order.status === "in_transit" && (
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-4 right-4 bg-white"
            onClick={() => updateLocationMutation.mutate()}
            disabled={updateLocationMutation.isPending}
            data-testid="refresh-location-button"
          >
            {updateLocationMutation.isPending ? <LoadingSpinner /> : "Refresh Location"}
          </Button>
        )}
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Order Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg" data-testid="order-id">Order #{order.orderNumber}</h3>
              <Badge className={getStatusColor(order.status)} data-testid="order-status">
                {order.status.replace("_", " ").toLowerCase()}
              </Badge>
            </div>

            {/* Progress Timeline */}
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center space-x-3" data-testid={`step-${step.key}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? "bg-green-500" 
                      : step.current 
                        ? "bg-orange-500" 
                        : "bg-gray-300"
                  }`}>
                    <step.icon 
                      size={16} 
                      className={`${step.completed || step.current ? "text-white" : "text-gray-600"} ${
                        step.current ? "animate-pulse" : ""
                      }`} 
                    />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${step.completed || step.current ? "text-gray-800" : "text-gray-500"}`}>
                      {step.label}
                    </p>
                    <p className="text-sm text-gray-600">
                      {step.completed 
                        ? format(new Date(order.updatedAt), "MMM dd, yyyy - h:mm a")
                        : step.current 
                          ? "In progress..."
                          : "Pending"
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Driver Info */}
        {delivery && (
          <Card data-testid="driver-info-card">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-3">Driver Details</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium">{delivery.driverName.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium" data-testid="driver-name">{delivery.driverName}</p>
                  <p className="text-sm text-gray-600" data-testid="driver-vehicle">
                    Vehicle: {delivery.vehicleNumber}
                  </p>
                  {delivery.driverRating && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="text-yellow-500 fill-current" size={16} />
                      <span className="text-sm" data-testid="driver-rating">{delivery.driverRating}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-primary border-primary"
                  onClick={() => window.open(`tel:${delivery.driverPhone}`)}
                  data-testid="call-driver-button"
                >
                  <Phone size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Summary */}
        <Card data-testid="order-summary-card">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-medium" data-testid="order-quantity">{order.quantity}L</span>
              </div>
              <div className="flex justify-between">
                <span>Rate per Liter:</span>
                <span data-testid="order-rate">₹{parseFloat(order.ratePerLiter).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges:</span>
                <span data-testid="delivery-charges">₹{parseFloat(order.deliveryCharges).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span data-testid="gst-amount">₹{parseFloat(order.gst).toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Total Amount:</span>
                <span data-testid="total-amount">₹{parseFloat(order.totalAmount).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-1">Delivery Address:</p>
              <p className="text-sm" data-testid="delivery-address">{order.deliveryAddress}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
