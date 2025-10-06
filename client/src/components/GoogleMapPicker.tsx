import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Loader2, CheckCircle, Navigation } from "lucide-react";

declare global {
  interface Window {
    google: any;
  }
}

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

interface GoogleMapPickerProps {
  onLocationSelect: (location: LocationData) => void;
}

const BANGALORE_BOUNDS = {
  north: 13.2,
  south: 12.7,
  east: 77.9,
  west: 77.3,
};

const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946 };

export default function GoogleMapPicker({
  onLocationSelect,
}: GoogleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const { toast } = useToast();

  const isInBangalore = (lat: number, lng: number) => {
    return (
      lat >= BANGALORE_BOUNDS.south &&
      lat <= BANGALORE_BOUNDS.north &&
      lng >= BANGALORE_BOUNDS.west &&
      lng <= BANGALORE_BOUNDS.east
    );
  };

  const loadGoogleMapsScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.google?.maps) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      );
      if (existingScript) {
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.google?.maps) {
            clearInterval(checkInterval);
            resolve();
          } else if (attempts > 100) {
            clearInterval(checkInterval);
            reject(new Error("Timeout waiting for Google Maps"));
          }
        }, 100);
        return;
      }

      const script = document.createElement("script");
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        reject(new Error("Google Maps API key not found"));
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;

      script.onload = () => {
        setTimeout(() => {
          if (window.google?.maps) {
            resolve();
          } else {
            reject(new Error("Google Maps API not ready"));
          }
        }, 200);
      };

      script.onerror = () => {
        reject(new Error("Failed to load Google Maps"));
      };

      document.head.appendChild(script);
    });
  };

  const getUserLocation = () => {
    return new Promise<{ lat: number; lng: number }>((resolve) => {
      if (!navigator.geolocation) {
        resolve(BANGALORE_CENTER);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          if (isInBangalore(lat, lng)) {
            resolve({ lat, lng });
          } else {
            resolve(BANGALORE_CENTER);
            toast({
              title: "Location Outside Bangalore",
              description:
                "Showing Bangalore center. Please select your delivery location.",
              variant: "destructive",
            });
          }
        },
        () => {
          resolve(BANGALORE_CENTER);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    });
  };

  const handleLocationChange = async (lat: number, lng: number) => {
    if (!isInBangalore(lat, lng)) {
      toast({
        title: "Outside Bangalore",
        description:
          "We only deliver in Bangalore. Please select a location within Bangalore city limits.",
        variant: "destructive",
      });
      return;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });

      if (response.results?.[0]) {
        const result = response.results[0];
        const components = result.address_components;

        let area = "",
          pincode = "",
          city = "",
          state = "";
        components.forEach((component: any) => {
          const types = component.types;
          if (
            types.includes("sublocality_level_1") ||
            types.includes("sublocality")
          ) {
            area = component.long_name;
          } else if (types.includes("postal_code")) {
            pincode = component.long_name;
          } else if (types.includes("locality")) {
            city = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.long_name;
          }
        });

        const isBangaloreCity =
          city.toLowerCase().includes("bangal") ||
          city.toLowerCase().includes("bengal");
        if (!isBangaloreCity) {
          toast({
            title: "Location Not in Bangalore",
            description: "Please select a location within Bangalore city.",
            variant: "destructive",
          });
          return;
        }

        const locationData: LocationData = {
          latitude: lat,
          longitude: lng,
          address: result.formatted_address,
          area: area || "Bangalore",
          pincode: pincode || "",
          city: "Bangalore",
          state: "Karnataka",
          formattedAddress: result.formatted_address,
        };

        setCurrentLocation(locationData);
        onLocationSelect(locationData);
      }
    } catch (error) {
      toast({
        title: "Address Error",
        description: "Failed to get address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const initMap = async () => {
    if (!mapRef.current) {
      setTimeout(initMap, 100);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await loadGoogleMapsScript();

      const location = await getUserLocation();

      const map = new window.google.maps.Map(mapRef.current, {
        center: location,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        restriction: {
          latLngBounds: {
            north: BANGALORE_BOUNDS.north,
            south: BANGALORE_BOUNDS.south,
            east: BANGALORE_BOUNDS.east,
            west: BANGALORE_BOUNDS.west,
          },
          strictBounds: false,
        },
      });

      const marker = new window.google.maps.Marker({
        position: location,
        map: map,
        draggable: true,
        title: "Drag to select your exact location",
        animation: window.google.maps.Animation.DROP,
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      marker.addListener("dragend", () => {
        const position = marker.getPosition();
        if (position) {
          handleLocationChange(position.lat(), position.lng());
        }
      });

      map.addListener("click", (event: any) => {
        if (event.latLng) {
          marker.setPosition(event.latLng);
          handleLocationChange(event.latLng.lat(), event.latLng.lng());
        }
      });

      setIsLoading(false);
      await handleLocationChange(location.lat, location.lng);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load map");
      setIsLoading(false);
    }
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const location = await getUserLocation();
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setCenter(location);
        mapInstanceRef.current.setZoom(16);
        markerRef.current.setPosition(location);
        await handleLocationChange(location.lat, location.lng);
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  useEffect(() => {
    initMap();
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="text-orange-600" size={20} />
            <span className="font-medium text-orange-800">
              Select Your Location on Map
            </span>
          </div>
          <Button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            className="bg-orange-600 hover:bg-orange-700 text-white"
            size="sm"
          >
            {isDetectingLocation ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Use My Location
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-orange-700">
          Drag the marker or click on map to pinpoint your exact location
        </p>
      </div>

      <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-orange-600" />
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-96 flex items-center justify-center bg-gray-50">
            <div className="text-center p-4">
              <div className="text-red-500 mb-2 text-2xl">⚠️</div>
              <p className="text-sm text-red-600 font-medium">
                Map failed to load
              </p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
              <Button onClick={initMap} className="mt-3" size="sm">
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div ref={mapRef} className="h-96 w-full" />
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-white rounded-lg p-3 shadow-lg border border-orange-200">
                <p className="text-sm text-gray-700 font-medium">
                  <MapPin className="h-4 w-4 inline mr-1 text-orange-500" />
                  Drag the marker or click on map to select your location
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  📍 Only Bangalore locations are accepted
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {currentLocation && !isLoading && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                Location Selected
              </p>
              <p className="text-sm text-green-700 mt-1">
                {currentLocation.formattedAddress}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-green-600">
                <span>📍 {currentLocation.area}</span>
                {currentLocation.pincode && (
                  <span>PIN: {currentLocation.pincode}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

