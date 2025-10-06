import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronDown, Navigation } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import LocationPrompt from "./LocationPrompt";

interface LocationHeaderProps {
  className?: string;
  showChangeButton?: boolean;
  compact?: boolean;
}

export default function LocationHeader({
  className = "",
  showChangeButton = true,
  compact = false,
}: LocationHeaderProps) {
  const { currentLocation } = useLocation();
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  const handleLocationChange = () => {
    setShowLocationPrompt(true);
  };

  if (!currentLocation) {
    return (
      <div className={`${className}`}>
        <Button
          onClick={handleLocationChange}
          variant="ghost"
          className="w-full justify-start p-3 h-auto bg-orange-50 hover:bg-orange-100 border border-orange-200"
        >
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <MapPin className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-orange-800">Set Your Location</p>
              <p className="text-sm text-orange-600">
                Choose your delivery location
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-orange-600" />
          </div>
        </Button>

        <LocationPrompt
          isOpen={showLocationPrompt}
          onClose={() => setShowLocationPrompt(false)}
          onLocationSet={() => setShowLocationPrompt(false)}
        />
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`${className}`}>
        <Button
          onClick={showChangeButton ? handleLocationChange : undefined}
          variant="ghost"
          className="w-full justify-start p-2 h-auto"
          disabled={!showChangeButton}
        >
          <div className="flex items-center gap-2 w-full">
            <MapPin className="h-4 w-4 text-green-600" />
            <div className="flex-1 text-left min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {currentLocation.area}
              </p>
            </div>
            {showChangeButton && (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </Button>

        {showChangeButton && (
          <LocationPrompt
            isOpen={showLocationPrompt}
            onClose={() => setShowLocationPrompt(false)}
            onLocationSet={() => setShowLocationPrompt(false)}
            title="Change Location"
          />
        )}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <Button
        onClick={showChangeButton ? handleLocationChange : undefined}
        variant="ghost"
        className="w-full justify-start p-3 h-auto bg-green-50 hover:bg-green-100 border border-green-200"
        disabled={!showChangeButton}
      >
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <MapPin className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="font-medium text-green-800">Delivering to</p>
            <p className="text-sm text-green-700 truncate">
              {currentLocation.area}, {currentLocation.city}
            </p>
            {currentLocation.pincode && (
              <p className="text-xs text-green-600">
                PIN: {currentLocation.pincode}
              </p>
            )}
          </div>
          {showChangeButton && (
            <div className="flex flex-col items-center">
              <ChevronDown className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600">Change</span>
            </div>
          )}
        </div>
      </Button>

      {showChangeButton && (
        <LocationPrompt
          isOpen={showLocationPrompt}
          onClose={() => setShowLocationPrompt(false)}
          onLocationSet={() => setShowLocationPrompt(false)}
          title="Change Delivery Location"
        />
      )}
    </div>
  );
}

// Quick location status component for headers/navbars
export function LocationStatus({ onClick }: { onClick?: () => void }) {
  const { currentLocation } = useLocation();

  if (!currentLocation) {
    return (
      <Button
        onClick={onClick}
        variant="ghost"
        size="sm"
        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
      >
        <Navigation className="h-4 w-4 mr-1" />
        Set Location
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className="text-green-600 hover:text-green-700 hover:bg-green-50 max-w-40"
    >
      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
      <span className="truncate">{currentLocation.area}</span>
    </Button>
  );
}