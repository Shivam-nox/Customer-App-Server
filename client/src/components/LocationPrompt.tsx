import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Navigation, Target, X } from "lucide-react";
import { useLocation as useLocationHook } from "@/hooks/useLocation";
import GoogleMapPicker from "./GoogleMapPicker";

interface LocationPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet?: () => void;
  title?: string;
  description?: string;
}

export default function LocationPrompt({
  isOpen,
  onClose,
  onLocationSet,
  title = "Set Your Location",
  description = "We need your location to show nearby restaurants and accurate delivery times.",
}: LocationPromptProps) {
  const [, navigate] = useLocation();
  const { saveLocation, getCurrentGPSLocation, isLoading } = useLocationHook();
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleGPSLocation = async () => {
    try {
      const location = await getCurrentGPSLocation();
      saveLocation(location);
      onLocationSet?.();
      onClose();
    } catch (error) {
      console.error("GPS location failed:", error);
      // Fallback to map picker
      setShowMapPicker(true);
    }
  };

  const handleMapLocation = (location: any) => {
    saveLocation(location);
    onLocationSet?.();
    onClose();
  };

  const handleManualEntry = () => {
    onClose();
    navigate("/location-picker");
  };

  // Map picker is now handled within the main dialog

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">{description}</p>

          {/* Location Options */}
          <div className="space-y-3">
            {/* GPS Location */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Button
                  onClick={handleGPSLocation}
                  disabled={isLoading}
                  variant="ghost"
                  className="w-full justify-start p-0 h-auto"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-gray-900">
                        Use GPS Location
                      </h3>
                      <p className="text-sm text-gray-600">
                        Automatically detect your current location
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Map Picker */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Button
                  onClick={() => setShowMapPicker(true)}
                  variant="ghost"
                  className="w-full justify-start p-0 h-auto"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-gray-900">
                        Select on Map
                      </h3>
                      <p className="text-sm text-gray-600">
                        Choose your location using our interactive map
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Button
                  onClick={handleManualEntry}
                  variant="ghost"
                  className="w-full justify-start p-0 h-auto"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Navigation className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-gray-900">
                        Enter Manually
                      </h3>
                      <p className="text-sm text-gray-600">
                        Type your address details manually
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Service Area Note */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> We currently deliver only in Bangalore.
              Please select a location within Bangalore city limits.
            </p>
          </div>
        </div>

        {/* Map Picker - Embedded */}
        {showMapPicker && (
          <div className="mt-4">
            <GoogleMapPicker onLocationSelect={handleMapLocation} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Hook to use location prompt
export function useLocationPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLocation } = useLocationHook();

  const showPrompt = () => setIsOpen(true);
  const hidePrompt = () => setIsOpen(false);

  const LocationPromptComponent = (props: Partial<LocationPromptProps>) => (
    <LocationPrompt isOpen={isOpen} onClose={hidePrompt} {...props} />
  );

  return {
    showPrompt,
    hidePrompt,
    isOpen,
    hasLocation: !!currentLocation,
    LocationPromptComponent,
  };
}
