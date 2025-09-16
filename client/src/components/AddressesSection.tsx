import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/loading-spinner";
import { MapPin, Edit, Trash2, Star } from "lucide-react";

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

export default function AddressesSection() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: addressesData, isLoading } = useQuery({
    queryKey: ["/api/addresses"],
    enabled: !!user,
  });

  const addresses = (addressesData as any)?.addresses || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="p-6 text-center" data-testid="no-addresses">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin size={24} className="text-gray-400" />
        </div>
        <h4 className="font-medium text-gray-800 mb-2">No Addresses Added</h4>
        <p className="text-sm text-gray-600 mb-4">
          Add your delivery addresses to make ordering easier
        </p>
        <Button
          size="sm"
          onClick={() => toast({ title: "Add Address", description: "Address management coming soon" })}
          data-testid="add-first-address"
        >
          Add Your First Address
        </Button>
      </div>
    );
  }

  const handleEditAddress = (address: CustomerAddress) => {
    toast({
      title: "Edit Address",
      description: `Editing ${address.label} - Feature coming soon`,
    });
  };

  const handleDeleteAddress = (address: CustomerAddress) => {
    toast({
      title: "Delete Address",
      description: `Delete ${address.label} - Feature coming soon`,
      variant: "destructive",
    });
  };

  const handleSetDefault = (address: CustomerAddress) => {
    toast({
      title: "Set Default",
      description: `Setting ${address.label} as default - Feature coming soon`,
    });
  };

  return (
    <div className="divide-y divide-gray-100" data-testid="addresses-list">
      {addresses.map((address: CustomerAddress, index: number) => (
        <div key={address.id} className="p-4" data-testid={`address-${address.id}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-blue-600 mt-1" />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-800" data-testid={`address-label-${address.id}`}>
                    {address.label}
                  </h4>
                  {address.isDefault && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      <Star size={10} className="mr-1" />
                      Default
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditAddress(address)}
                className="p-1 h-8 w-8"
                data-testid={`edit-address-${address.id}`}
              >
                <Edit size={14} className="text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteAddress(address)}
                className="p-1 h-8 w-8"
                data-testid={`delete-address-${address.id}`}
              >
                <Trash2 size={14} className="text-red-500" />
              </Button>
            </div>
          </div>

          <div className="ml-6 space-y-1" data-testid={`address-details-${address.id}`}>
            <p className="text-sm text-gray-800">
              {address.addressLine1}
              {address.addressLine2 && `, ${address.addressLine2}`}
            </p>
            {address.landmark && (
              <p className="text-sm text-gray-600">
                Near {address.landmark}
              </p>
            )}
            <p className="text-sm text-gray-600">
              {address.area}, {address.city}, {address.state} - {address.pincode}
            </p>
          </div>

          {!address.isDefault && (
            <div className="ml-6 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSetDefault(address)}
                className="text-blue-600 border-blue-300"
                data-testid={`set-default-${address.id}`}
              >
                <Star size={14} className="mr-1" />
                Set as Default
              </Button>
            </div>
          )}

          {index < addresses.length - 1 && <div className="mt-4"></div>}
        </div>
      ))}
    </div>
  );
}