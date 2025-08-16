import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import LoadingSpinner from "@/components/loading-spinner";
import { ArrowLeft, MapPin, Locate, Calculator } from "lucide-react";

const orderSchema = z.object({
  quantity: z.number().min(100, "Minimum order is 100 liters").max(10000, "Maximum order is 10,000 liters"),
  deliveryAddress: z.string().min(10, "Please enter a complete address"),
  deliveryDate: z.string().min(1, "Please select delivery date"),
  deliveryTime: z.string().min(1, "Please select delivery time"),
});

type OrderForm = z.infer<typeof orderSchema>;

export default function NewOrderScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      quantity: 500,
      deliveryAddress: "",
      deliveryDate: "",
      deliveryTime: "",
    },
  });

  const quantity = form.watch("quantity");
  const ratePerLiter = 70.50;
  const subtotal = quantity * ratePerLiter;
  const deliveryCharges = 300;
  const gst = subtotal * 0.18;
  const totalAmount = subtotal + deliveryCharges + gst;

  // Set minimum date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('deliveryDate') as HTMLInputElement;
    if (dateInput) {
      dateInput.min = today;
    }
  }, []);

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderForm & { deliveryLatitude?: number; deliveryLongitude?: number }) => {
      const response = await apiRequest("POST", "/api/orders", {
        ...data,
        deliveryLatitude: coordinates?.lat,
        deliveryLongitude: coordinates?.lng,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order Created",
        description: `Order ${data.order.orderNumber} created successfully`,
      });
      setLocation(`/payment/${data.order.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        
        // Reverse geocode to get address
        try {
          // In production, use a proper geocoding service
          const address = `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`;
          form.setValue("deliveryAddress", address);
          
          toast({
            title: "Location Found",
            description: "Current location has been set",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to get address from location",
            variant: "destructive",
          });
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Location Error",
          description: "Please allow location access or enter address manually",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const onSubmit = (data: OrderForm) => {
    createOrderMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="new-order-screen">
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
        <h2 className="text-lg font-medium" data-testid="page-title">New Order</h2>
      </div>

      <div className="flex-1 p-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Order Details */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-4 flex items-center" data-testid="order-details-title">
                <Calculator className="mr-2" size={20} />
                Order Details
              </h3>
              
              <div className="space-y-4">
                <div className="floating-label">
                  <Input
                    {...form.register("quantity", { valueAsNumber: true })}
                    type="number"
                    placeholder=" "
                    min="100"
                    max="10000"
                    step="50"
                    className="peer"
                    data-testid="quantity-input"
                  />
                  <Label className="peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                    Diesel Quantity (Liters)
                  </Label>
                </div>

                {form.formState.errors.quantity && (
                  <p className="text-sm text-destructive" data-testid="quantity-error">
                    {form.formState.errors.quantity.message}
                  </p>
                )}

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Rate per Liter:</span>
                        <span className="font-medium" data-testid="rate-per-liter">₹{ratePerLiter.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span data-testid="subtotal">₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Charges:</span>
                        <span data-testid="delivery-charges">₹{deliveryCharges}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (18%):</span>
                        <span data-testid="gst">₹{gst.toLocaleString()}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Estimated Total:</span>
                        <span className="text-primary" data-testid="total-amount">₹{totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Location */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-4 flex items-center" data-testid="delivery-location-title">
                <MapPin className="mr-2" size={20} />
                Delivery Location
              </h3>
              
              <div className="space-y-4">
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full ripple"
                  data-testid="current-location-button"
                >
                  {isGettingLocation ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <Locate size={20} className="mr-2" />
                      Use Current Location
                    </>
                  )}
                </Button>

                <div className="text-center text-gray-500">or</div>

                <div className="floating-label">
                  <Textarea
                    {...form.register("deliveryAddress")}
                    placeholder=" "
                    rows={3}
                    className="peer resize-none"
                    data-testid="address-input"
                  />
                  <Label className="peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                    Enter Delivery Address
                  </Label>
                </div>

                {form.formState.errors.deliveryAddress && (
                  <p className="text-sm text-destructive" data-testid="address-error">
                    {form.formState.errors.deliveryAddress.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Time */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-4" data-testid="delivery-time-title">Delivery Time</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="floating-label">
                  <Input
                    {...form.register("deliveryDate")}
                    type="date"
                    id="deliveryDate"
                    className="peer"
                    data-testid="delivery-date-input"
                  />
                  <Label className="peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                    Date
                  </Label>
                </div>

                <Select onValueChange={(value) => form.setValue("deliveryTime", value)}>
                  <SelectTrigger data-testid="delivery-time-select">
                    <SelectValue placeholder="Select Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00" data-testid="time-09-00">9:00 AM</SelectItem>
                    <SelectItem value="10:00" data-testid="time-10-00">10:00 AM</SelectItem>
                    <SelectItem value="11:00" data-testid="time-11-00">11:00 AM</SelectItem>
                    <SelectItem value="14:00" data-testid="time-14-00">2:00 PM</SelectItem>
                    <SelectItem value="15:00" data-testid="time-15-00">3:00 PM</SelectItem>
                    <SelectItem value="16:00" data-testid="time-16-00">4:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.formState.errors.deliveryDate && (
                <p className="text-sm text-destructive mt-2" data-testid="date-error">
                  {form.formState.errors.deliveryDate.message}
                </p>
              )}

              {form.formState.errors.deliveryTime && (
                <p className="text-sm text-destructive mt-2" data-testid="time-error">
                  {form.formState.errors.deliveryTime.message}
                </p>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full bg-secondary hover:bg-green-600 text-white py-4 text-lg font-bold ripple"
            disabled={createOrderMutation.isPending}
            data-testid="proceed-payment-button"
          >
            {createOrderMutation.isPending ? <LoadingSpinner /> : "Proceed to Payment"}
          </Button>
        </form>
      </div>
    </div>
  );
}
