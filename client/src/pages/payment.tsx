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
import { ArrowLeft, CreditCard, Smartphone, Building2, Wallet, Shield, CheckCircle, HandCoins } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentScreen() {
  const { orderId } = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const { data: orderData, isLoading } = useQuery({
    queryKey: ["/api/orders", orderId],
    queryFn: () => fetch(`/api/orders/${orderId}`, {
      headers: { "x-user-id": user?.id || "" },
    }).then(res => res.json()),
    enabled: !!orderId && !!user,
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (data: { orderId: string; method: string }) => {
      const response = await apiRequest("POST", "/api/payments", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (selectedMethod === "cod") {
        toast({
          title: "Order Confirmed",
          description: "Your order has been confirmed! Pay when your order is delivered.",
        });
        setLocation(`/track-order/${orderId}`);
      } else {
        setPaymentProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
          toast({
            title: "Payment Successful",
            description: "Your order has been confirmed and will be processed shortly",
          });
          setLocation(`/track-order/${orderId}`);
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
      processPaymentMutation.mutate({
        orderId: orderId!,
        method: selectedMethod,
      });
    } else {
      // Show popup for other payment methods
      toast({
        title: "Payment Method Not Available",
        description: "This payment method is not supported yet. Please select Cash on Delivery.",
        variant: "destructive",
      });
    }
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!orderData?.order) {
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

  const { order } = orderData;

  if (paymentProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50" data-testid="payment-processing">
        <Card className="w-full max-w-sm mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2" data-testid="processing-title">Processing Payment</h3>
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
      preferred: true,
    },
    {
      id: "upi",
      name: "UPI Payment",
      description: "Pay using any UPI app (Coming Soon)",
      icon: Smartphone,
      color: "text-purple-400",
      disabled: true,
    },
    {
      id: "cards",
      name: "Credit/Debit Cards",
      description: "Visa, MasterCard, RuPay (Coming Soon)",
      icon: CreditCard,
      color: "text-blue-400",
      disabled: true,
    },
    {
      id: "netbanking",
      name: "Net Banking",
      description: "All major banks supported (Coming Soon)",
      icon: Building2,
      color: "text-gray-400",
      disabled: true,
    },
    {
      id: "wallet",
      name: "Mobile Wallets",
      description: "Paytm, PhonePe, Mobikwik (Coming Soon)",
      icon: Wallet,
      color: "text-orange-400",
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="payment-screen">
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
        <h2 className="text-lg font-medium" data-testid="page-title">Payment</h2>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Order Summary */}
        <Card data-testid="order-summary">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Diesel Quantity:</span>
                <span className="font-medium" data-testid="order-quantity">{order.quantity}L</span>
              </div>
              <div className="flex justify-between">
                <span>Rate per Liter:</span>
                <span data-testid="rate-per-liter">₹{parseFloat(order.ratePerLiter).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span data-testid="subtotal">₹{parseFloat(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges:</span>
                <span data-testid="delivery-charges">₹{parseFloat(order.deliveryCharges).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span data-testid="gst">₹{parseFloat(order.gst).toLocaleString()}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span className="text-primary" data-testid="total-amount">₹{parseFloat(order.totalAmount).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card data-testid="payment-methods">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-4">Select Payment Method</h3>
            
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-3">
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
                          className={`font-medium cursor-pointer ${isDisabled ? 'text-gray-400' : ''}`}
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
                      <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`} data-testid={`${method.id}-description`}>
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
        <Card className="bg-green-50 border-green-200" data-testid="security-info">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="text-green-600 mt-1" size={20} />
              <div>
                <p className="text-sm font-medium text-green-800" data-testid="security-title">Secure Payment</p>
                <p className="text-xs text-green-700 mt-1" data-testid="security-description">
                  Your payment information is encrypted and secure. We don't store your card details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handlePayment}
          className="w-full bg-primary hover:bg-blue-700 text-white py-4 text-lg font-bold ripple"
          disabled={processPaymentMutation.isPending || !selectedMethod}
          data-testid="pay-button"
        >
          {processPaymentMutation.isPending ? (
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
