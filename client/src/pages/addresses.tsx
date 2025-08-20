import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import LoadingSpinner from "@/components/loading-spinner";
import { 
  ArrowLeft, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Home, 
  Building, 
  MapIcon,
  MoreVertical
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AddressesScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: addressesData, isLoading } = useQuery({
    queryKey: ["/api/addresses"],
    queryFn: () => fetch("/api/addresses", {
      headers: { "x-user-id": user?.id || "" },
    }).then(res => res.json()),
    enabled: !!user,
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await apiRequest("DELETE", `/api/addresses/${addressId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Address deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAddress = (addressId: string) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      deleteAddressMutation.mutate(addressId);
    }
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home className="text-blue-600" size={20} />;
      case "work":
        return <Building className="text-green-600" size={20} />;
      default:
        return <MapIcon className="text-gray-600" size={20} />;
    }
  };

  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case "home":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "work":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!user) return null;

  const addresses = addressesData?.addresses || [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="addresses-screen">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/profile")}
            className="mr-3"
            data-testid="back-button"
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-lg font-medium" data-testid="page-title">My Addresses</h2>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-primary hover:bg-primary/90"
          data-testid="add-address-button"
        >
          <Plus size={16} className="mr-2" />
          Add New
        </Button>
      </div>

      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-8" data-testid="no-addresses">
            <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Addresses Found</h3>
            <p className="text-gray-500 mb-4">Add your first delivery address to get started</p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-primary hover:bg-primary/90"
              data-testid="add-first-address-button"
            >
              <Plus size={16} className="mr-2" />
              Add Address
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address: any) => (
              <Card key={address.id} className="hover:shadow-md transition-shadow" data-testid={`address-card-${address.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {getAddressTypeIcon(address.type)}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900" data-testid={`address-title-${address.id}`}>
                            {address.label || address.title || `${address.type.charAt(0).toUpperCase() + address.type.slice(1)} Address`}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              className={`text-xs capitalize ${getAddressTypeColor(address.type)}`}
                              data-testid={`address-type-${address.id}`}
                            >
                              {address.type}
                            </Badge>
                            {address.isDefault && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg mb-2">
                        <p className="text-gray-700 font-medium mb-1" data-testid={`address-text-${address.id}`}>
                          {address.address}
                        </p>
                        {address.landmark && (
                          <p className="text-sm text-gray-600" data-testid={`address-landmark-${address.id}`}>
                            <MapPin size={14} className="inline mr-1" />
                            Near: {address.landmark}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {address.city && (
                          <span className="font-medium" data-testid={`address-city-${address.id}`}>
                            {address.city}
                          </span>
                        )}
                        {address.pincode && (
                          <span data-testid={`address-pincode-${address.id}`}>
                            PIN: {address.pincode}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast({ title: "Edit Address", description: "Address editing coming soon" })}
                        data-testid={`edit-address-${address.id}`}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-address-${address.id}`}
                        disabled={deleteAddressMutation.isPending}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Address Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent data-testid="add-address-dialog">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <MapPin className="mx-auto mb-4 text-primary" size={48} />
            <p className="text-gray-600 mb-4">
              Address management functionality will be available soon.
            </p>
            <p className="text-sm text-gray-500">
              You can add addresses when placing an order.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}