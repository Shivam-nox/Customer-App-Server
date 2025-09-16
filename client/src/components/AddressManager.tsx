import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { geocodeAddress, buildAddressString } from "@/lib/geocoding";
import { Plus, MapPin, Edit, Trash2, Star, Loader2 } from "lucide-react";

const addressSchema = z.object({
  label: z.string().min(1, "Address label is required"),
  addressLine1: z
    .string()
    .min(10, "Address line 1 must be at least 10 characters"),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  area: z.string().min(2, "Area is required"),
  city: z.literal("Bangalore", {
    errorMap: () => ({ message: "We only serve in Bangalore" }),
  }),
  state: z.literal("Karnataka"),
  pincode: z
    .string()
    .regex(/^5[0-9]{5}$/, "Please enter a valid Bangalore pincode (5xxxxx)"),
});

type AddressForm = z.infer<typeof addressSchema>;

interface CustomerAddress {
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

interface AddressManagerProps {
  onSelectAddress: (address: CustomerAddress) => void;
  selectedAddressId?: string;
}

// Common Bangalore areas for dropdown
const BANGALORE_AREAS = [
  "Koramangala",
  "Indira Nagar",
  "Whitefield",
  "Electronic City",
  "BTM Layout",
  "HSR Layout",
  "Jayanagar",
  "Malleshwaram",
  "Basavanagudi",
  "Rajajinagar",
  "Banashankari",
  "JP Nagar",
  "Marathahalli",
  "Sarjapur",
  "Bellandur",
  "Hebbal",
  "Yeshwanthpur",
  "Vijayanagar",
  "KR Puram",
  "RT Nagar",
  "Ulsoor",
  "Richmond Town",
  "Frazer Town",
  "Commercial Street",
  "MG Road",
  "Brigade Road",
  "Cunningham Road",
  "Vasanth Nagar",
  "Sadashivanagar",
];

export default function AddressManager({
  onSelectAddress,
  selectedAddressId,
}: AddressManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(
    null,
  );

  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      addressLine1: "",
      addressLine2: "",
      landmark: "",
      area: "",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "",
    },
  });

  // Fetch saved addresses
  const { data: addressesData, isLoading } = useQuery({
    queryKey: ["/api/addresses"],
    queryFn: () =>
      fetch("/api/addresses", {
        headers: { "x-user-id": user?.id || "" },
      }).then((res) => res.json()),
    enabled: !!user,
  });

  // Create address mutation with geocoding
  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressForm) => {
      console.log('📍 [ADDRESS MANAGER] Starting address creation with data:', data);
      
      // Build complete address string for geocoding
      const fullAddress = buildAddressString(data);
      console.log('🏠 [ADDRESS MANAGER] Built full address string:', fullAddress);

      // Attempt to geocode the address
      console.log('🗺️ [ADDRESS MANAGER] Starting geocoding process...');
      const coordinates = await geocodeAddress(fullAddress);
      console.log('📍 [ADDRESS MANAGER] Geocoding result:', coordinates);

      // Prepare address data with coordinates (if available)
      const addressData = {
        ...data,
        latitude: coordinates?.latitude.toString() || null,
        longitude: coordinates?.longitude.toString() || null,
      };
      
      console.log('💾 [ADDRESS MANAGER] Final address data to save:', addressData);

      const response = await apiRequest("POST", "/api/addresses", addressData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Address Saved",
        description: "Your address has been saved with location coordinates",
      });
      setIsAddDialogOpen(false);
      form.reset();

      // Auto-select the newly created address
      if (data.address) {
        onSelectAddress(data.address);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save address",
        variant: "destructive",
      });
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/addresses/${addressId}`,
        {},
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Address Deleted",
        description: "Address has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive",
      });
    },
  });

  // Set default address mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await apiRequest(
        "PUT",
        `/api/addresses/${addressId}/default`,
        {},
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Default Address Updated",
        description: "This address is now your default delivery location",
      });
    },
  });

  const onSubmit = (data: AddressForm) => {
    createAddressMutation.mutate(data);
  };

  const handleEditAddress = (address: CustomerAddress) => {
    setEditingAddress(address);
    form.reset({
      label: address.label,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      area: address.area,
      city: address.city as "Bangalore",
      state: address.state as "Karnataka",
      pincode: address.pincode,
    });
    setIsAddDialogOpen(true);
  };

  const addresses = addressesData?.addresses || [];

  if (isLoading) {
    return <div className="text-center py-4">Loading addresses...</div>;
  }

  return (
    <div className="space-y-4" data-testid="address-manager">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Delivery Address</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              data-testid="add-address-button"
            >
              <Plus size={16} className="mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Edit Address" : "Add New Address"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Address Label */}
              <div>
                <Label htmlFor="label">Address Label *</Label>
                <Controller
                  name="label"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="address-label-select">
                        <SelectValue placeholder="Select address type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Home">🏠 Home</SelectItem>
                        <SelectItem value="Office">🏢 Office</SelectItem>
                        <SelectItem value="Warehouse">🏭 Warehouse</SelectItem>
                        <SelectItem value="Factory">🏗️ Factory</SelectItem>
                        <SelectItem value="Store">🏪 Store</SelectItem>
                        <SelectItem value="Other">📍 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.label && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.label.message}
                  </p>
                )}
              </div>

              {/* Address Line 1 */}
              <div>
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  {...form.register("addressLine1")}
                  placeholder="Building name, floor, etc."
                  data-testid="address-line1-input"
                />
                {form.formState.errors.addressLine1 && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.addressLine1.message}
                  </p>
                )}
              </div>

              {/* Address Line 2 */}
              <div>
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  {...form.register("addressLine2")}
                  placeholder="Street name, locality"
                  data-testid="address-line2-input"
                />
              </div>

              {/* Landmark */}
              <div>
                <Label htmlFor="landmark">Landmark</Label>
                <Input
                  {...form.register("landmark")}
                  placeholder="Near metro station, mall, etc."
                  data-testid="landmark-input"
                />
              </div>

              {/* Area */}
              <div>
                <Label htmlFor="area">Area *</Label>
                <Input
                  {...form.register("area")}
                  placeholder="Area in Bangalore."
                  data-testid="area-select"
                />
                {/* <Controller
                  name="area"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="area-select">
                        <SelectValue placeholder="Select area in Bangalore" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANGALORE_AREAS.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                /> */}
                {form.formState.errors.area && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.area.message}
                  </p>
                )}
              </div>

              {/* Pincode */}
              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  {...form.register("pincode")}
                  placeholder="560001"
                  maxLength={6}
                  data-testid="pincode-input"
                />
                {form.formState.errors.pincode && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.pincode.message}
                  </p>
                )}
              </div>

              {/* City and State (readonly) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>City</Label>
                  <Input value="Bangalore" disabled />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value="Karnataka" disabled />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingAddress(null);
                    form.reset();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAddressMutation.isPending}
                  className="flex-1"
                  data-testid="save-address-button"
                >
                  {createAddressMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    "Save Address"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Saved Addresses */}
      {addresses.length > 0 ? (
        <RadioGroup
          value={selectedAddressId}
          onValueChange={(value) => {
            const address = addresses.find(
              (addr: CustomerAddress) => addr.id === value,
            );
            if (address) onSelectAddress(address);
          }}
        >
          <div className="space-y-3">
            {addresses.map((address: CustomerAddress) => (
              <Card
                key={address.id}
                className={`cursor-pointer transition-colors ${
                  selectedAddressId === address.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-gray-50"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem
                      value={address.id}
                      id={address.id}
                      className="mt-1"
                      data-testid={`address-${address.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Label
                          htmlFor={address.id}
                          className="font-medium cursor-pointer"
                        >
                          {address.label}
                        </Label>
                        {address.isDefault && (
                          <Star
                            className="text-yellow-500 fill-current"
                            size={16}
                          />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                        {address.landmark && `, Near ${address.landmark}`}
                        <br />
                        {address.area}, Bangalore, Karnataka - {address.pincode}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAddress(address)}
                        data-testid={`edit-address-${address.id}`}
                      >
                        <Edit size={14} />
                      </Button>
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDefaultMutation.mutate(address.id)}
                          data-testid={`set-default-${address.id}`}
                        >
                          <Star size={14} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAddressMutation.mutate(address.id)}
                        data-testid={`delete-address-${address.id}`}
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </RadioGroup>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No saved addresses
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first delivery address to get started
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add Address
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
