import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import LoadingSpinner from "@/components/loading-spinner";
import AddressManager from "@/components/AddressManager";
import { ArrowLeft, Calculator } from "lucide-react";

const orderSchema = z.object({
  quantity: z
    .number()
    .min(100, "Minimum order is 100 liters")
    .max(10000, "Maximum order is 10,000 liters"),
  deliveryDate: z.string().min(1, "Please select delivery date"),
  deliveryTime: z.string().min(1, "Please select delivery time"),
});

type OrderForm = z.infer<typeof orderSchema>;

interface SavedAddress {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: string;
  longitude?: string;
  isDefault: boolean;
}

export default function NewOrderScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(
    null,
  );

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      quantity: 500,
      deliveryDate: "",
      deliveryTime: "",
    },
  });

  const quantity = form.watch("quantity");

  // Fetch pricing settings from database
  const { data: pricingSettings } = useQuery({
    queryKey: ["/api/settings/category/pricing"],
    enabled: !!user,
  });

  const { data: taxSettings } = useQuery({
    queryKey: ["/api/settings/category/tax"],
    enabled: !!user,
  });

  const { data: orderSettings } = useQuery({
    queryKey: ["/api/settings/category/order"],
    enabled: !!user,
  });

  // Calculate pricing with dynamic values
  const ratePerLiter = parseFloat(
    (pricingSettings as any)?.settings?.find(
      (s: any) => s.key === "rate_per_liter",
    )?.value || "90",
  );
  const deliveryCharges = parseFloat(
    (pricingSettings as any)?.settings?.find(
      (s: any) => s.key === "delivery_charges",
    )?.value || "300",
  );
  const gstRate = parseFloat(
    (taxSettings as any)?.settings?.find((s: any) => s.key === "gst_rate")
      ?.value || "0.18",
  );
  const minQuantity = parseInt(
    (orderSettings as any)?.settings?.find(
      (s: any) => s.key === "minimum_order_quantity",
    )?.value || "100",
  );
  const maxQuantity = parseInt(
    (orderSettings as any)?.settings?.find(
      (s: any) => s.key === "maximum_order_quantity",
    )?.value || "10000",
  );
  const orderStep = parseInt(
    (orderSettings as any)?.settings?.find((s: any) => s.key === "order_step")
      ?.value || "50",
  );

  const subtotal = quantity * ratePerLiter;
  const gst = deliveryCharges * gstRate;
  const totalAmount = subtotal + deliveryCharges + gst;

  // Set minimum date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById(
      "deliveryDate",
    ) as HTMLInputElement;
    if (dateInput) {
      dateInput.min = today;
    }
  }, []);

  const onSubmit = (data: OrderForm) => {
    if (!selectedAddress) {
      toast({
        title: "Address Required",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    // Prepare order data to pass to payment page
    const orderData = {
      quantity: data.quantity,
      deliveryDate: data.deliveryDate,
      deliveryTime: data.deliveryTime,
      address: selectedAddress,
      pricing: {
        ratePerLiter,
        subtotal,
        deliveryCharges,
        gst,
        totalAmount,
      },
    };

    // Store order data in localStorage temporarily and redirect to payment
    localStorage.setItem("pendingOrderData", JSON.stringify(orderData));
    setLocation("/payment/new");
  };

  if (!user) return null;

  return (
    <div
      className="min-h-screen flex flex-col bg-gray-50"
      data-testid="new-order-screen"
    >
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
        <h2 className="text-lg font-medium" data-testid="page-title">
          New Order
        </h2>
      </div>

      <div className="flex-1 p-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Order Details */}
          <Card>
            <CardContent className="p-4">
              <h3
                className="font-bold text-lg mb-4 flex items-center"
                data-testid="order-details-title"
              >
                <Calculator className="mr-2" size={20} />
                Order Details
              </h3>

              <div className="space-y-4">
                <div className="floating-label">
                  <Input
                    {...form.register("quantity", { valueAsNumber: true })}
                    type="number"
                    placeholder=" "
                    min={minQuantity}
                    max={maxQuantity}
                    step={orderStep}
                    className="peer"
                    data-testid="quantity-input"
                  />
                  <Label className="peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                    Diesel Quantity (Liters)
                  </Label>
                </div>

                {form.formState.errors.quantity && (
                  <p
                    className="text-sm text-destructive"
                    data-testid="quantity-error"
                  >
                    {form.formState.errors.quantity.message}
                  </p>
                )}

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Rate per Liter:</span>
                        <span
                          className="font-medium"
                          data-testid="rate-per-liter"
                        >
                          ₹{ratePerLiter.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span data-testid="subtotal">
                          ₹{subtotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Charges:</span>
                        <span data-testid="delivery-charges">
                          ₹{deliveryCharges}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (18%):</span>
                        <span data-testid="gst">₹{gst.toLocaleString()}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Estimated Total:</span>
                        <span
                          className="text-primary"
                          data-testid="total-amount"
                        >
                          ₹{totalAmount.toLocaleString()}
                        </span>
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
              <AddressManager
                onSelectAddress={setSelectedAddress}
                selectedAddressId={selectedAddress?.id}
              />
            </CardContent>
          </Card>

          {/* Delivery Time */}
          <Card>
            <CardContent className="p-4">
              <h3
                className="font-bold text-lg mb-4"
                data-testid="delivery-time-title"
              >
                Delivery Time
              </h3>

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

                <Controller
                  name="deliveryTime"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="delivery-time-select">
                        <SelectValue placeholder="Select Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:00" data-testid="time-09-00">
                          9:00 AM
                        </SelectItem>
                        <SelectItem value="10:00" data-testid="time-10-00">
                          10:00 AM
                        </SelectItem>
                        <SelectItem value="11:00" data-testid="time-11-00">
                          11:00 AM
                        </SelectItem>
                        <SelectItem value="14:00" data-testid="time-14-00">
                          2:00 PM
                        </SelectItem>
                        <SelectItem value="15:00" data-testid="time-15-00">
                          3:00 PM
                        </SelectItem>
                        <SelectItem value="16:00" data-testid="time-16-00">
                          4:00 PM
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {form.formState.errors.deliveryDate && (
                <p
                  className="text-sm text-destructive mt-2"
                  data-testid="date-error"
                >
                  {form.formState.errors.deliveryDate.message}
                </p>
              )}

              {form.formState.errors.deliveryTime && (
                <p
                  className="text-sm text-destructive mt-2"
                  data-testid="time-error"
                >
                  {form.formState.errors.deliveryTime.message}
                </p>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full bg-secondary hover:bg-green-600 text-white py-4 text-lg font-bold ripple"
            data-testid="proceed-payment-button"
          >
            Proceed to Payment
          </Button>
        </form>
      </div>
    </div>
  );
}
