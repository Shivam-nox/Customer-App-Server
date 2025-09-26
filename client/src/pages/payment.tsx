import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import LoadingSpinner from "@/components/loading-spinner";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Shield,
  CheckCircle,
  HandCoins,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentScreen() {
  const { orderId } = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  // Check if this is a new order (from new-order page) or existing order
  const isNewOrder = orderId === "new";

  useEffect(() => {
    if (isNewOrder) {
      // Get pending order data from localStorage
      const storedData = localStorage.getItem("pendingOrderData");
      if (storedData) {
        setPendingOrderData(JSON.parse(storedData));
      } else {
        // No pending order data, redirect back to new order
        setLocation("/new-order");
      }
    }
  }, [isNewOrder, setLocation]);

  const { data: orderData, isLoading } = useQuery({
    queryKey: ["/api/orders", orderId],
    queryFn: () =>
      fetch(`/api/orders/${orderId}`, {
        headers: { "x-user-id": user?.id || "" },
      }).then((res) => res.json()),
    enabled: !!orderId && !!user && !isNewOrder,
  });

  // Mutation to create order and process payment in one go
  const createOrderAndPaymentMutation = useMutation({
    mutationFn: async (data: { method: string }) => {
      if (isNewOrder && pendingOrderData) {
        // First create the order
        const fullAddress = `${pendingOrderData.address.addressLine1}${pendingOrderData.address.addressLine2 ? ", " + pendingOrderData.address.addressLine2 : ""}${pendingOrderData.address.landmark ? ", Near " + pendingOrderData.address.landmark : ""}, ${pendingOrderData.address.area}, ${pendingOrderData.address.city}, ${pendingOrderData.address.state} - ${pendingOrderData.address.pincode}`;

        const orderResponse = await apiRequest("POST", "/api/orders", {
          quantity: pendingOrderData.quantity,
          deliveryAddress: fullAddress,
          deliveryAddressId: pendingOrderData.address.id,
          scheduledDate: pendingOrderData.deliveryDate,
          scheduledTime: pendingOrderData.deliveryTime,
          deliveryLatitude: pendingOrderData.address.latitude
            ? parseFloat(pendingOrderData.address.latitude)
            : undefined,
          deliveryLongitude: pendingOrderData.address.longitude
            ? parseFloat(pendingOrderData.address.longitude)
            : undefined,
        });
        const orderResult = await orderResponse.json();

        // Then process payment for the created order
        const paymentResponse = await apiRequest("POST", "/api/payments", {
          orderId: orderResult.order.id,
          method: data.method,
        });
        const paymentResult = await paymentResponse.json();

        return { order: orderResult.order, payment: paymentResult.payment };
      } else {
        // For existing orders, just process payment
        const response = await apiRequest("POST", "/api/payments", {
          orderId,
          method: data.method,
        });
        return response.json();
      }
    },
    onSuccess: (data) => {
      const finalOrderId = isNewOrder ? data.order.id : orderId;

      // Clear pending order data
      if (isNewOrder) {
        localStorage.removeItem("pendingOrderData");
      }

      if (selectedMethod === "cod") {
        toast({
          title: "Order Confirmed",
          description:
            "Your order has been confirmed! Pay when your order is delivered.",
        });
        setLocation(`/track-order/${finalOrderId}`);
      } else {
        setPaymentProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
          toast({
            title: "Payment Successful",
            description:
              "Your order has been confirmed and will be processed shortly",
          });
          setLocation(`/track-order/${finalOrderId}`);
        }, 3000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Payment processing failed",
        variant: "destructive",
      });
    },
  });

  // Razorpay payment processing
  const processRazorpayPayment = async (finalOrderId: string) => {
    try {
      console.log('🔄 Starting Razorpay payment for order:', finalOrderId);
      
      // Check if Razorpay is loaded
      // @ts-ignore
      if (typeof window.Razorpay === 'undefined') {
        console.error('❌ Razorpay SDK not found on window object');
        console.log('Available on window:', Object.keys(window).filter(key => key.toLowerCase().includes('razor')));
        
        // Try to load Razorpay dynamically
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        
        // Wait a bit for the script to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // @ts-ignore
        if (typeof window.Razorpay === 'undefined') {
          throw new Error('Failed to load Razorpay SDK dynamically');
        }
      }
      
      // Create Razorpay order
      console.log('📤 Creating Razorpay order...');
      const response = await apiRequest("POST", "/api/payments/razorpay/create-order", {
        orderId: finalOrderId,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }
      
      const { razorpayOrderId, amount, currency, keyId, orderDetails } = await response.json();
      console.log('✅ Razorpay order created:', { razorpayOrderId, amount, currency });

      // Initialize Razorpay checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Zapygo",
        description: `Fuel Order #${orderDetails.orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#1976D2",
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        config: {
          display: {
            blocks: {
              utib: { // Axis Bank
                name: "Pay using Axis Bank",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" }
                ]
              },
              other: { // Other payment methods
                name: "Other Payment Methods",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "upi" },
                  { method: "wallet" }
                ]
              }
            },
            hide: [
              { method: "emi" }
            ],
            sequence: ["block.utib", "block.other"],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await apiRequest("POST", "/api/payments/razorpay/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: finalOrderId,
            });

            const result = await verifyResponse.json();
            
            if (result.success) {
              toast({
                title: "Payment Successful",
                description: "Your order has been confirmed and will be processed shortly",
              });
              setLocation(`/track-order/${finalOrderId}`);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if amount was deducted",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: function () {
            toast({
              title: "Payment Cancelled",
              description: "You can retry payment anytime from order details",
              variant: "destructive",
            });
          },
        },
      };

      console.log('🚀 Opening Razorpay checkout with options:', options);
      
      // @ts-ignore - Razorpay is loaded via script tag
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("❌ Razorpay payment error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePayment = () => {
    if (!selectedMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please choose a payment method to continue",
        variant: "destructive",
      });
      return;
    }

    // Check if Cash on Delivery is selected
    if (selectedMethod === "cod") {
      createOrderAndPaymentMutation.mutate({
        method: selectedMethod,
      });
    } else if (selectedMethod === "upi" || selectedMethod === "cards" || selectedMethod === "netbanking" || selectedMethod === "wallet") {
      // For Razorpay payment methods, first create the order then process payment
      if (isNewOrder && pendingOrderData) {
        // Create order first, then process Razorpay payment
        const createOrderMutation = async () => {
          try {
            const fullAddress = `${pendingOrderData.address.addressLine1}${pendingOrderData.address.addressLine2 ? ", " + pendingOrderData.address.addressLine2 : ""}${pendingOrderData.address.landmark ? ", Near " + pendingOrderData.address.landmark : ""}, ${pendingOrderData.address.area}, ${pendingOrderData.address.city}, ${pendingOrderData.address.state} - ${pendingOrderData.address.pincode}`;

            const orderResponse = await apiRequest("POST", "/api/orders", {
              quantity: pendingOrderData.quantity,
              deliveryAddress: fullAddress,
              deliveryAddressId: pendingOrderData.address.id,
              scheduledDate: pendingOrderData.deliveryDate,
              scheduledTime: pendingOrderData.deliveryTime,
              deliveryLatitude: pendingOrderData.address.latitude
                ? parseFloat(pendingOrderData.address.latitude)
                : undefined,
              deliveryLongitude: pendingOrderData.address.longitude
                ? parseFloat(pendingOrderData.address.longitude)
                : undefined,
            });
            const orderResult = await orderResponse.json();
            
            // Clear pending order data
            localStorage.removeItem("pendingOrderData");
            
            // Process Razorpay payment
            await processRazorpayPayment(orderResult.order.id);
          } catch (error) {
            console.error("Order creation error:", error);
            toast({
              title: "Order Creation Failed",
              description: "Unable to create order. Please try again.",
              variant: "destructive",
            });
          }
        };
        
        createOrderMutation();
      } else {
        // For existing orders, directly process Razorpay payment
        processRazorpayPayment(orderId);
      }
    } else {
      toast({
        title: "Payment Method Not Available",
        description: "This payment method is not supported yet.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // For new orders, check if we have pending data
  if (isNewOrder && !pendingOrderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // For existing orders, check if order data is loaded
  if (!isNewOrder && (isLoading || !orderData?.order)) {
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
          <h2 className="text-lg font-medium">Payment</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Order not found</p>
              <Button onClick={() => setLocation("/home")} className="mt-4">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get order data from either existing order or pending order data
  const order = isNewOrder
    ? {
        quantity: pendingOrderData?.quantity || 0,
        ratePerLiter: pendingOrderData?.pricing?.ratePerLiter || 0,
        subtotal: pendingOrderData?.pricing?.subtotal || 0,
        deliveryCharges: pendingOrderData?.pricing?.deliveryCharges || 0,
        gst: pendingOrderData?.pricing?.gst || 0,
        totalAmount: pendingOrderData?.pricing?.totalAmount || 0,
        deliveryAddress: `${pendingOrderData?.address?.addressLine1 || ""}${pendingOrderData?.address?.addressLine2 ? ", " + pendingOrderData.address.addressLine2 : ""}${pendingOrderData?.address?.landmark ? ", Near " + pendingOrderData.address.landmark : ""}, ${pendingOrderData?.address?.area || ""}, ${pendingOrderData?.address?.city || ""}, ${pendingOrderData?.address?.state || ""} - ${pendingOrderData?.address?.pincode || ""}`,
        scheduledDate: pendingOrderData?.deliveryDate || "",
        scheduledTime: pendingOrderData?.deliveryTime || "",
      }
    : orderData?.order;

  if (paymentProcessing) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
        data-testid="payment-processing"
      >
        <Card className="w-full max-w-sm mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h3
              className="text-xl font-bold mb-2"
              data-testid="processing-title"
            >
              Processing Payment
            </h3>
            <p className="text-gray-600 mb-6" data-testid="processing-message">
              Please wait while we confirm your payment...
            </p>
            <LoadingSpinner />
          </CardContent>
        </Card>
      </div>
    );
  }

  const paymentMethods = [
    {
      id: "cod",
      name: "Cash on Delivery",
      description: "Pay when your order is delivered",
      icon: HandCoins,
      color: "text-green-600",
      preferred: false,
    },
    {
      id: "upi",
      name: "UPI Payment",
      description: "Pay using any UPI app",
      icon: Smartphone,
      color: "text-purple-600",
      disabled: false,
      preferred: true,
    },
    {
      id: "cards",
      name: "Credit/Debit Cards",
      description: "Visa, MasterCard, RuPay",
      icon: CreditCard,
      color: "text-blue-600",
      disabled: false,
    },
    {
      id: "netbanking",
      name: "Net Banking",
      description: "All major banks supported",
      icon: Building2,
      color: "text-gray-600",
      disabled: false,
    },
    {
      id: "wallet",
      name: "Mobile Wallets",
      description: "Paytm, PhonePe, Mobikwik",
      icon: Wallet,
      color: "text-orange-600",
      disabled: false,
    },
  ];

  return (
    <div
      className="min-h-screen bg-gray-50"
      data-testid="payment-screen"
    >
      <div className="flex items-center p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/new-order`)}
          className="mr-3"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-lg font-medium" data-testid="page-title">
          Payment
        </h2>
      </div>
      <div className="p-4 pb-6 space-y-4">
        {/* Order Summary */}
        <Card data-testid="order-summary">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Diesel Quantity:</span>
                <span className="font-medium" data-testid="order-quantity">
                  {order.quantity}L
                </span>
              </div>
              <div className="flex justify-between">
                <span>Rate per Liter:</span>
                <span data-testid="rate-per-liter">
                  ₹{parseFloat(order.ratePerLiter).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span data-testid="subtotal">
                  ₹{parseFloat(order.subtotal).toLocaleString()}
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
                <span data-testid="gst">
                  ₹{parseFloat(order.gst).toLocaleString()}
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span className="text-primary" data-testid="total-amount">
                  ₹{parseFloat(order.totalAmount).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card data-testid="payment-methods">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-4">Select Payment Method</h3>

            <RadioGroup
              value={selectedMethod}
              onValueChange={setSelectedMethod}
              className="space-y-3"
            >
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isDisabled = method.disabled;
                const isPreferred = method.preferred;

                return (
                  <div
                    key={method.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                      isPreferred
                        ? "border-green-300 bg-green-50"
                        : isDisabled
                          ? "border-gray-100 bg-gray-50 opacity-60"
                          : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <RadioGroupItem
                      value={method.id}
                      id={method.id}
                      disabled={isDisabled}
                      data-testid={`payment-${method.id}`}
                    />
                    <Icon className={`${method.color}`} size={24} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={method.id}
                          className={`font-medium cursor-pointer ${isDisabled ? "text-gray-400" : ""}`}
                          data-testid={`${method.id}-label`}
                        >
                          {method.name}
                        </Label>
                        {isPreferred && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm ${isDisabled ? "text-gray-400" : "text-gray-600"}`}
                        data-testid={`${method.id}-description`}
                      >
                        {method.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card
          className="bg-green-50 border-green-200"
          data-testid="security-info"
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="text-green-600 mt-1" size={20} />
              <div>
                <p
                  className="text-sm font-medium text-green-800"
                  data-testid="security-title"
                >
                  Secure Payment
                </p>
                <p
                  className="text-xs text-green-700 mt-1"
                  data-testid="security-description"
                >
                  Your payment information is encrypted and secure. We don't
                  store your card details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Razorpay Button - Remove in production */}
        <Button
          onClick={async () => {
            try {
              // Test 1: Check if Razorpay SDK is loaded
              // @ts-ignore
              const sdkLoaded = typeof window.Razorpay !== 'undefined';
              console.log('🔍 Razorpay SDK loaded:', sdkLoaded);
              
              if (!sdkLoaded) {
                toast({
                  title: "Razorpay SDK Not Loaded",
                  description: "The Razorpay script failed to load. Check console for details.",
                  variant: "destructive",
                });
                return;
              }
              
              // Test 2: Check backend connection
              console.log('🔗 Testing backend connection...');
              const response = await fetch("/api/payments/razorpay/test", {
                headers: { 
                  "x-user-id": user?.id || "",
                  "Content-Type": "application/json"
                },
              });
              
              console.log('📡 Response status:', response.status);
              console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              const contentType = response.headers.get('content-type');
              if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('❌ Expected JSON but got:', contentType, text.substring(0, 200));
                throw new Error(`Server returned ${contentType} instead of JSON. Is the server running?`);
              }
              
              const result = await response.json();
              console.log('🧪 Backend test result:', result);
              
              toast({
                title: result.success ? "✅ All Tests Passed" : "❌ Backend Test Failed",
                description: result.success 
                  ? "Razorpay SDK loaded & backend configured correctly" 
                  : result.error,
                variant: result.success ? "default" : "destructive",
              });
            } catch (error) {
              console.error('❌ Test error:', error);
              toast({
                title: "Test Failed",
                description: "Unable to test Razorpay connection",
                variant: "destructive",
              });
            }
          }}
          variant="outline"
          className="w-full mb-2"
        >
          🧪 Test Razorpay (SDK + Backend)
        </Button>

        <Button
          onClick={handlePayment}
          className="w-full bg-primary hover:bg-blue-700 text-white py-4 text-lg font-bold ripple"
          disabled={createOrderAndPaymentMutation.isPending || !selectedMethod}
          data-testid="pay-button"
        >
          {createOrderAndPaymentMutation.isPending ? (
            <LoadingSpinner />
          ) : selectedMethod === "cod" ? (
            "Confirm Order (COD)"
          ) : (
            `Pay ₹${parseFloat(order.totalAmount).toLocaleString()}`
          )}
        </Button>
      </div>
    </div>
  );
}
