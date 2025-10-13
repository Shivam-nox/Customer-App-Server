import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, CheckCircle } from "lucide-react";
import GoogleMapPicker from "./GoogleMapPicker";

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  area: string;
  pincode: string;
  city: string;
  state: string;
  formattedAddress: string;
}

interface LocationPickerProps {
  onLocationSelect?: (location: LocationData) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  initialLocation?: LocationData;
}

export default function LocationPicker({
  onLocationSelect,
  onCancel,
  title = "Select Your Location",
  subtitle = "Choose your delivery location on the map",
  showBackButton = true,
  initialLocation,
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [showMap, setShowMap] = useState(false);

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1">
              <h1 className="font-semibold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        {/* Map Picker Button */}
        <div className="bg-white rounded-lg border p-6 text-center">
          <MapPin className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">
            Select Location on Map
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Use our interactive map to pinpoint your exact delivery location
          </p>
          <Button
            onClick={() => setShowMap(!showMap)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {showMap ? 'Hide Map' : 'Show Map'}
          </Button>
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="mt-4 bg-white rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Selected Location</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedLocation.formattedAddress}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Area: {selectedLocation.area}</span>
                  {selectedLocation.pincode && (
                    <span>PIN: {selectedLocation.pincode}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Picker - Embedded */}
        {showMap && (
          <div className="mt-4">
            <GoogleMapPicker onLocationSelect={handleLocationSelect} />
          </div>
        )}
      </div>
    </div>
  );
}

// Standalone page component
export function LocationPickerPage() {
  const [, navigate] = useLocation();

  const handleLocationSelect = (location: LocationData) => {
    // Store location in localStorage or state management
    localStorage.setItem("selectedLocation", JSON.stringify(location));

    // Navigate back or to next step
    navigate("/");
  };

  return (
    <LocationPicker
      onLocationSelect={handleLocationSelect}
      title="Select Delivery Location"
      subtitle="We deliver only in Bangalore"
    />
  );
}
