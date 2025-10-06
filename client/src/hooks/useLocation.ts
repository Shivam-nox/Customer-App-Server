import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  area: string;
  pincode: string;
  city: string;
  state: string;
  formattedAddress: string;
}

const LOCATION_STORAGE_KEY = "zapygo_user_location";

export function useLocation() {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load saved location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setCurrentLocation(location);
      } catch (error) {
        console.error("Failed to parse saved location:", error);
        localStorage.removeItem(LOCATION_STORAGE_KEY);
      }
    }
  }, []);

  // Save location to localStorage and state
  const saveLocation = useCallback((location: LocationData) => {
    setCurrentLocation(location);
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    
    toast({
      title: "Location Saved! 📍",
      description: `Delivery location set to ${location.area}, Bangalore`,
    });
  }, [toast]);

  // Clear saved location
  const clearLocation = useCallback(() => {
    setCurrentLocation(null);
    localStorage.removeItem(LOCATION_STORAGE_KEY);
  }, []);

  // Get user's current GPS location
  const getCurrentGPSLocation = useCallback(async (): Promise<LocationData> => {
    setIsLoading(true);
    
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setIsLoading(false);
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocode to get address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'Zapygo-App/1.0'
                }
              }
            );

            if (response.ok) {
              const data = await response.json();
              const address = data.address || {};
              
              const locationData: LocationData = {
                latitude,
                longitude,
                address: data.display_name || "GPS Location",
                area: address.neighbourhood || address.suburb || address.locality || "Bangalore",
                pincode: address.postcode || "",
                city: "Bangalore",
                state: "Karnataka",
                formattedAddress: data.display_name || `${latitude}, ${longitude}`,
              };

              setIsLoading(false);
              resolve(locationData);
            } else {
              throw new Error("Failed to get address from coordinates");
            }
          } catch (error) {
            setIsLoading(false);
            reject(error);
          }
        },
        (error) => {
          setIsLoading(false);
          let message = "Failed to get your location.";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied. Please enable location permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              message = "Location request timed out.";
              break;
          }
          
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });
  }, []);

  // Check if location is in Bangalore
  const isLocationInBangalore = useCallback((location: LocationData): boolean => {
    const bangaloreBounds = {
      north: 13.20,
      south: 12.70,
      east: 77.90,
      west: 77.30,
    };

    return (
      location.latitude >= bangaloreBounds.south &&
      location.latitude <= bangaloreBounds.north &&
      location.longitude >= bangaloreBounds.west &&
      location.longitude <= bangaloreBounds.east
    );
  }, []);

  return {
    currentLocation,
    isLoading,
    saveLocation,
    clearLocation,
    getCurrentGPSLocation,
    isLocationInBangalore,
  };
}