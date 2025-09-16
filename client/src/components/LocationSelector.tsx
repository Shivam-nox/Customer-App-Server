import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Plus } from "lucide-react";
import { useLocation } from "wouter";

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

export default function LocationSelector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const { data: addressesData, isLoading } = useQuery({
    queryKey: ["/api/addresses"],
    enabled: !!user,
  });

  const addresses = (addressesData as any)?.addresses || [];
  const defaultAddress = addresses.find((addr: CustomerAddress) => addr.isDefault);

  useEffect(() => {
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [defaultAddress, selectedAddressId]);

  const detectLocation = () => {
    setIsDetecting(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location detection",
        variant: "destructive",
      });
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setIsDetecting(false);
        toast({
          title: "Location Detected",
          description: `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
      },
      (error) => {
        setIsDetecting(false);
        let message = "Unable to detect location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable location permission.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }

        toast({
          title: "Location Detection Failed",
          description: message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const selectedAddress = addresses.find((addr: CustomerAddress) => addr.id === selectedAddressId);

  const handleSelectChange = (value: string) => {
    if (value === "use-current-location") {
      detectLocation();
    } else if (value === "add-new-address") {
      setLocation("/profile");
    } else {
      setSelectedAddressId(value);
    }
  };

  return (
    <div className="space-y-3" data-testid="location-selector">
      <Select value={selectedAddressId} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-full" data-testid="address-selector">
          <SelectValue placeholder="Choose an address" />
        </SelectTrigger>
        <SelectContent>
          {addresses.map((address: CustomerAddress) => (
            <SelectItem key={address.id} value={address.id}>
              <div className="text-left">
                <p className="font-medium">{address.label}</p>
                <p className="text-sm text-gray-600">
                  {address.addressLine1}, {address.area}, {address.city} - {address.pincode}
                </p>
              </div>
            </SelectItem>
          ))}
          <SelectItem value="use-current-location">
            <div className="flex items-center space-x-2">
              <Navigation size={16} className="text-green-600" />
              <span>{isDetecting ? "Detecting Location..." : "Use Current Location"}</span>
            </div>
          </SelectItem>
          <SelectItem value="add-new-address">
            <div className="flex items-center space-x-2">
              <Plus size={16} className="text-blue-600" />
              <span>Add New Address</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {selectedAddress && (
        <div className="bg-gray-50 rounded-lg p-3" data-testid="selected-address-details">
          <p className="font-medium text-gray-800">{selectedAddress.label}</p>
          <p className="text-sm text-gray-600">
            {selectedAddress.addressLine1}
            {selectedAddress.addressLine2 && `, ${selectedAddress.addressLine2}`}
          </p>
          <p className="text-sm text-gray-600">
            {selectedAddress.landmark && `${selectedAddress.landmark}, `}
            {selectedAddress.area}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
          </p>
        </div>
      )}

      {currentLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3" data-testid="current-location-display">
          <div className="flex items-center space-x-2">
            <Navigation size={16} className="text-green-600" />
            <div>
              <p className="font-medium text-green-800">Current Location Detected</p>
              <p className="text-sm text-green-700">
                Lat: {currentLocation.lat.toFixed(4)}, Lng: {currentLocation.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}