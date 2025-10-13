import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import LoadingSpinner from "@/components/loading-spinner";
import GoogleTrackingMap from "@/components/GoogleTrackingMap";
import {
  ArrowLeft,
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  Truck,
  Star,
  Key,
  Download,
} from "lucide-react";
import { format } from "date-fns";

export default function TrackOrderScreen() {
  const { orderId } = useParams<{ orderId?: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // If no orderId is provided, redirect to orders page
  if (!orderId) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex items-center p-4 border-b bg-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/orders")}
            className="mr-3"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-semibold">Track Order</h1>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Order Selected
              </h2>
              <p className="text-gray-600 mb-4">
                Please select an order to track from your order history.
              </p>
              <Button onClick={() => setLocation("/orders")} className="w-full">
                View Order History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/orders", orderId],
    queryFn: async () => {
      if (!orderId) {
        throw new Error("Order ID is required");
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        headers: { "x-user-id": user?.id || "" },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch order: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Order fetch result:", result);

      if (!result || !result.order) {
        throw new Error("Order not found");
      }

      return result;
    },
    enabled: !!orderId && !!user,
    retry: false, // Don't retry on error
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
        }
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
          "x-user-id": user?.id || "",
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

  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  const downloadInvoice = async () => {
    if (isDownloadingInvoice) return;

    setIsDownloadingInvoice(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
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
      a.download = `invoice-${order?.orderNumber || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `Invoice for order ${order?.orderNumber} downloaded successfully`,
      });
    } catch (error: any) {
      console.error("Invoice download error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data?.order) {
    // Only log actual errors, not missing data
    if (error) {
      console.error("Error fetching order:", error);
    }

    const errorMessage = error?.message || "Order not found";
    const isNotFound =
      errorMessage.includes("not found") || errorMessage.includes("404");

    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex items-center p-4 border-b bg-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/orders")}
            className="mr-3"
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-lg font-medium">Track Order</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isNotFound ? "Order Not Found" : "Unable to Load Order"}
              </h3>
              <p className="text-gray-600 mb-4">
                {isNotFound
                  ? "The order you're looking for doesn't exist or you don't have permission to view it."
                  : "There was a problem loading the order details. Please try again."}
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => setLocation("/orders")}
                  className="w-full"
                >
                  View Order History
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
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

            <GoogleTrackingMap
              deliveryAddress={order.deliveryAddress}
              orderStatus={order.status}
              deliveryLatitude={
                order.deliveryLatitude
                  ? parseFloat(order.deliveryLatitude)
                  : undefined
              }
              deliveryLongitude={
                order.deliveryLongitude
                  ? parseFloat(order.deliveryLongitude)
                  : undefined
              }
            />

            {/* Map Legend - Dynamic based on order status */}
            <div
              className={`mt-4 grid ${
                order.status === "in_transit" || order.status === "delivered"
                  ? "grid-cols-3"
                  : "grid-cols-1"
              } gap-2 text-center text-xs`}
            >
              {(order.status === "in_transit" ||
                order.status === "delivered") && (
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">⛽</span>
                  </div>
                  <span>Fuel Terminal</span>
                </div>
              )}
              <div className="flex items-center justify-center space-x-1">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📍</span>
                </div>
                <span className="font-medium">Your Delivery Location</span>
              </div>
              {(order.status === "in_transit" ||
                order.status === "delivered") && (
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🚛</span>
                  </div>
                  <span>Driver</span>
                </div>
              )}
            </div>

            {/* Phase 1 Info Message */}
            {order.status !== "in_transit" && order.status !== "delivered" && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-xs text-blue-800 font-medium">
                  📍 Your delivery location is confirmed
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Live driver tracking will appear once your order is dispatched
                </p>
              </div>
            )}
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

            {/* Driver Details Section - Shows when driver is assigned */}
            {delivery ? (
              <div
                className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg"
                data-testid="driver-details-section"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-green-800 flex items-center">
                    <Truck className="mr-2 text-green-600" size={16} />
                    Your Delivery Partner
                  </h4>
                  {delivery.status && (
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        delivery.status === "on_delivery"
                          ? "bg-orange-100 text-orange-800"
                          : delivery.status === "online"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {delivery.status === "on_delivery"
                        ? "On the way"
                        : delivery.status === "online"
                        ? "Available"
                        : delivery.status?.replace("_", " ").toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white border-2 border-green-200 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-lg font-bold text-green-700">
                        {delivery.driverName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p
                        className="font-semibold text-gray-900"
                        data-testid="driver-name"
                      >
                        {delivery.driverName}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        {delivery.driverRating > 0 && (
                          <>
                            <Star
                              className="text-yellow-500 fill-current"
                              size={14}
                            />
                            <span
                              className="text-sm text-gray-600"
                              data-testid="driver-rating"
                            >
                              {delivery.driverRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              • {delivery.totalDeliveries} deliveries
                            </span>
                          </>
                        )}
                      </div>
                      <p
                        className="text-xs text-gray-500 mt-1"
                        data-testid="driver-phone"
                      >
                        {delivery.driverPhone}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white px-4"
                      onClick={() => window.open(`tel:${delivery.driverPhone}`)}
                      data-testid="call-driver-button"
                    >
                      <Phone size={14} className="mr-2" />
                      Call
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-300 hover:bg-green-50 px-4"
                      onClick={() => window.open(`sms:${delivery.driverPhone}`)}
                      data-testid="sms-driver-button"
                    >
                      💬 Chat
                    </Button>
                  </div>
                </div>
              </div>
            ) : order.driverId ? (
              <div
                className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                data-testid="driver-assigning-section"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                    <Truck
                      className="text-yellow-700 animate-pulse"
                      size={16}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-yellow-900">
                      Assigning delivery partner...
                    </p>
                    <p className="text-sm text-yellow-700">
                      We're finding the best driver for your order
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              order.status !== "pending" && (
                <div
                  className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  data-testid="driver-search-section"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                      <Truck
                        className="text-blue-700 animate-bounce"
                        size={16}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">
                        Looking for delivery partner
                      </p>
                      <p className="text-sm text-blue-700">
                        We're connecting you with a nearby driver
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}

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
                      className={`${
                        step.completed || step.current
                          ? "text-white"
                          : "text-gray-600"
                      } ${step.current ? "animate-pulse" : ""}`}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        step.completed || step.current
                          ? "text-gray-800"
                          : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-sm text-gray-600">
                      {step.completed
                        ? format(
                            new Date(order.updatedAt),
                            "MMM dd, yyyy - h:mm a"
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
          <Card
            className="border-2 border-orange-200 bg-orange-50"
            data-testid="delivery-otp-section"
          >
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-2">
                  <Key className="text-white" size={16} />
                </div>
                <h3 className="font-bold text-lg text-orange-800">
                  Delivery Verification
                </h3>
              </div>

              {order.deliveryOtp ? (
                <>
                  <p className="text-sm text-orange-700 mb-3">
                    Share this code with your driver to authorize delivery
                  </p>
                  <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
                    <div
                      className="text-3xl font-bold text-orange-600 tracking-widest"
                      data-testid="delivery-otp"
                    >
                      {order.deliveryOtp}
                    </div>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ Only share this code when the driver arrives at your
                    location
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-orange-700 mb-4">
                    Generate a verification code to authorize delivery when your
                    driver arrives
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

        {/* Download Invoice Section for Delivered Orders */}
        {order.status === "delivered" && (
          <Card
            className="border-2 border-green-200 bg-green-50"
            data-testid="download-invoice-section"
          >
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <h4 className="font-semibold text-green-800">
                  Order Delivered Successfully!
                </h4>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Your order has been delivered. Download your invoice for your
                records.
              </p>
              <Button
                onClick={downloadInvoice}
                disabled={isDownloadingInvoice}
                className="bg-green-600 hover:bg-green-700 text-white font-medium"
                data-testid="download-invoice-button"
              >
                {isDownloadingInvoice ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <Download size={16} className="mr-2" />
                    Download Invoice
                  </>
                )}
              </Button>
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
