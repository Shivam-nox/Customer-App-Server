import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import LoadingSpinner from "@/components/loading-spinner";
import TrackingMap from "@/components/TrackingMap";
import {
  ArrowLeft,
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  Truck,
  Star,
  Key,
} from "lucide-react";
import { format } from "date-fns";

export default function TrackOrderScreen() {
  const { orderId } = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/orders", orderId],
    queryFn: () =>
      fetch(`/api/orders/${orderId}`, {
        headers: { "x-user-id": user?.id || "" },
      }).then((res) => res.json()),
    enabled: !!orderId && !!user,
  });

  const updateLocationMutation = useMutation({
    mutationFn: async () => {
      // Simulate driver location update
      const response = await fetch(
        `/api/orders/${orderId}/update-driver-location`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: 19.076 + (Math.random() - 0.5) * 0.01,
            longitude: 72.8777 + (Math.random() - 0.5) * 0.01,
          }),
        },
      );
      return response.json();
    },
  });

  const generateOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/generate-otp`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user?.id || ""
        },
      });
      if (!response.ok) {
        throw new Error("Failed to generate OTP");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "OTP Generated",
        description: "Delivery verification code has been created",
      });
      // Refresh the order data to show the new OTP
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate OTP",
        variant: "destructive",
      });
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
              <Button onClick={() => setLocation("/orders")} className="mt-4">
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
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressSteps = () => {
    const steps = [
      { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
      { key: "in_transit", label: "Out for Delivery", icon: Truck },
      { key: "delivered", label: "Delivered", icon: MapPin },
    ];

    const statusOrder = ["pending", "confirmed", "in_transit", "delivered"];
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
    <div
      className="min-h-screen flex flex-col bg-gray-50"
      data-testid="track-order-screen"
    >
      <div className="flex items-center p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/orders")}
          className="mr-3"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-lg font-medium" data-testid="page-title">
          Track Order
        </h2>
      </div>

      {/* Real Map View */}
      <div className="p-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Live Tracking</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">
                  {order.status === "in_transit"
                    ? "Driver En Route"
                    : order.status === "delivered"
                      ? "Delivered"
                      : order.status === "confirmed"
                        ? "Order Confirmed"
                        : "Preparing Order"}
                </span>
              </div>
            </div>

            <TrackingMap
              deliveryAddress={order.deliveryAddress}
              orderStatus={order.status}
            />

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="flex items-center justify-center space-x-1">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">⛽</span>
                </div>
                <span>Fuel Terminal</span>
              </div>
              <div className="flex items-center justify-center space-x-1">
                <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">📍</span>
                </div>
                <span>Your Location</span>
              </div>
              <div className="flex items-center justify-center space-x-1">
                <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🚛</span>
                </div>
                <span>Driver</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Order Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg" data-testid="order-id">
                Order #{order.orderNumber}
              </h3>
              <Badge
                className={getStatusColor(order.status)}
                data-testid="order-status"
              >
                {order.status.replace("_", " ").toLowerCase()}
              </Badge>
            </div>

            {/* Progress Timeline */}
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.key}
                  className="flex items-center space-x-3"
                  data-testid={`step-${step.key}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed
                        ? "bg-green-500"
                        : step.current
                          ? "bg-orange-500"
                          : "bg-gray-300"
                    }`}
                  >
                    <step.icon
                      size={16}
                      className={`${step.completed || step.current ? "text-white" : "text-gray-600"} ${
                        step.current ? "animate-pulse" : ""
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${step.completed || step.current ? "text-gray-800" : "text-gray-500"}`}
                    >
                      {step.label}
                    </p>
                    <p className="text-sm text-gray-600">
                      {step.completed
                        ? format(
                            new Date(order.updatedAt),
                            "MMM dd, yyyy - h:mm a",
                          )
                        : step.current
                          ? "In progress..."
                          : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* OTP Section for In-Transit Orders */}
        {order.status === "in_transit" && (
          <Card className="border-2 border-orange-200 bg-orange-50" data-testid="delivery-otp-section">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-2">
                  <Key className="text-white" size={16} />
                </div>
                <h3 className="font-bold text-lg text-orange-800">Delivery Verification</h3>
              </div>
              
              {order.deliveryOtp ? (
                <>
                  <p className="text-sm text-orange-700 mb-3">
                    Share this code with your driver to authorize delivery
                  </p>
                  <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
                    <div className="text-3xl font-bold text-orange-600 tracking-widest" data-testid="delivery-otp">
                      {order.deliveryOtp}
                    </div>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ Only share this code when the driver arrives at your location
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-orange-700 mb-4">
                    Generate a verification code to authorize delivery when your driver arrives
                  </p>
                  <Button
                    onClick={() => generateOtpMutation.mutate()}
                    disabled={generateOtpMutation.isPending}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium"
                    data-testid="generate-otp-button"
                  >
                    {generateOtpMutation.isPending ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <Key size={16} className="mr-2" />
                        Generate Delivery OTP
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Driver Info */}
        {delivery && (
          <Card data-testid="driver-info-card">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-3">Driver Details</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium">
                    {delivery.driverName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium" data-testid="driver-name">
                    {delivery.driverName}
                  </p>
                  <p
                    className="text-sm text-gray-600"
                    data-testid="driver-vehicle"
                  >
                    Vehicle: {delivery.vehicleNumber}
                  </p>
                  {delivery.driverRating && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Star
                        className="text-yellow-500 fill-current"
                        size={16}
                      />
                      <span className="text-sm" data-testid="driver-rating">
                        {delivery.driverRating}
                      </span>
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
                <span className="font-medium" data-testid="order-quantity">
                  {order.quantity}L
                </span>
              </div>
              <div className="flex justify-between">
                <span>Rate per Liter:</span>
                <span data-testid="order-rate">
                  ₹{parseFloat(order.ratePerLiter).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges:</span>
                <span data-testid="delivery-charges">
                  ₹{parseFloat(order.deliveryCharges).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span data-testid="gst-amount">
                  ₹{parseFloat(order.gst).toFixed(2)}
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Total Amount:</span>
                <span data-testid="total-amount">
                  ₹{parseFloat(order.totalAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-1">Delivery Address:</p>
              <p className="text-sm" data-testid="delivery-address">
                {order.deliveryAddress}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
