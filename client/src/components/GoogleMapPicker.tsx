import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Loader2,
  CheckCircle,
  Navigation,
  AlertCircle,
} from "lucide-react";

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
  console.log("🎨 GoogleMapPicker COMPONENT RENDERED");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("Component initialized");
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const { toast } = useToast();

  console.log("📊 STATE:", {
    isLoading,
    error,
    hasCurrentLocation: !!currentLocation,
    debugInfo,
  });

  const isInBangalore = (lat: number, lng: number) => {
    return (
      lat >= BANGALORE_BOUNDS.south &&
      lat <= BANGALORE_BOUNDS.north &&
      lng >= BANGALORE_BOUNDS.west &&
      lng <= BANGALORE_BOUNDS.east
    );
  };

  const loadGoogleMapsScript = () => {
    console.log("🔄 loadGoogleMapsScript CALLED");
    setDebugInfo("Loading Google Maps script...");

    return new Promise<void>((resolve, reject) => {
      console.log("📡 Checking if Google Maps already loaded...");
      // Check if API key exists
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      console.log("API Key present:", !!apiKey);
      console.log("API Key length:", apiKey?.length || 0);

      if (!apiKey) {
        const errorMsg =
          "❌ VITE_GOOGLE_MAPS_API_KEY not found in environment variables";
        console.error(errorMsg);
        setDebugInfo(errorMsg);
        reject(new Error("Google Maps API key not configured"));
        return;
      }

      setDebugInfo("✅ API key found, loading script...");

      if (window.google?.maps) {
        console.log("Google Maps already loaded");
        setDebugInfo("✅ Google Maps already loaded");
        resolve();
        return;
      }

      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      );

      if (existingScript) {
        console.log("Script tag exists, waiting for load...");
        setDebugInfo("⏳ Script exists, waiting for Google Maps...");
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.google?.maps) {
            clearInterval(checkInterval);
            console.log("Google Maps loaded successfully");
            setDebugInfo("✅ Google Maps loaded!");
            resolve();
          } else if (attempts > 100) {
            clearInterval(checkInterval);
            const errorMsg = "Timeout: Google Maps didn't load in 10 seconds";
            console.error(errorMsg);
            setDebugInfo(`❌ ${errorMsg}`);
            reject(new Error(errorMsg));
          }
        }, 100);
        return;
      }

      console.log("Creating new Google Maps script...");
      setDebugInfo("📥 Creating Google Maps script tag...");

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log("Script loaded, checking for google.maps...");
        setDebugInfo("⏳ Script loaded, initializing...");
        setTimeout(() => {
          if (window.google?.maps) {
            console.log("✅ Google Maps API ready!");
            setDebugInfo("✅ Google Maps API ready!");
            resolve();
          } else {
            const errorMsg = "Google Maps API not available after script load";
            console.error(errorMsg);
            setDebugInfo(`❌ ${errorMsg}`);
            reject(new Error(errorMsg));
          }
        }, 200);
      };

      script.onerror = (e) => {
        const errorMsg =
          "Failed to load Google Maps script - Check API key and billing";
        console.error(errorMsg, e);
        setDebugInfo(`❌ ${errorMsg}`);
        reject(new Error(errorMsg));
      };

      document.head.appendChild(script);
      console.log("Script tag appended to head");
    });
  };

  const getUserLocation = () => {
    console.log(
      "🌍 getUserLocation CALLED - Attempting to get real GPS location"
    );
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported, using Bangalore center");
        setDebugInfo("⚠️ GPS not supported, using default location");
        resolve(BANGALORE_CENTER);
        return;
      }

      setDebugInfo("📡 Requesting GPS location...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          console.log(
            "✅ Got GPS location:",
            location,
            "Accuracy:",
            position.coords.accuracy,
            "meters"
          );
          setDebugInfo(
            `✅ GPS location acquired (±${Math.round(
              position.coords.accuracy
            )}m accuracy)`
          );

          // Check if location is in Bangalore
          if (isInBangalore(location.lat, location.lng)) {
            resolve(location);
          } else {
            console.warn("Location outside Bangalore, using city center");
            setDebugInfo("⚠️ Location outside Bangalore, using city center");
            toast({
              title: "Location Outside Service Area",
              description:
                "Your location is outside Bangalore. Showing Bangalore center.",
              variant: "destructive",
            });
            resolve(BANGALORE_CENTER);
          }
        },
        (error) => {
          console.error("GPS error:", error.message);
          let errorMsg = "GPS unavailable";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "Location permission denied";
              setDebugInfo("❌ Location permission denied by user");
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "Location unavailable";
              setDebugInfo("❌ GPS position unavailable");
              break;
            case error.TIMEOUT:
              errorMsg = "Location request timeout";
              setDebugInfo("❌ GPS request timed out");
              break;
          }

          toast({
            title: errorMsg,
            description: "Using Bangalore center as default location",
          });

          resolve(BANGALORE_CENTER);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0, // Don't use cached location
        }
      );
    });
  };

  const handleLocationChange = useCallback(
    async (lat: number, lng: number) => {
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
            city = "";
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
        console.error("Geocoding error:", error);
        toast({
          title: "Address Error",
          description: "Failed to get address. Please try again.",
          variant: "destructive",
        });
      }
    },
    [toast, onLocationSelect]
  );

  const initMap = useCallback(async () => {
    if (!mapRef.current) {
      console.log("Map ref not ready, retrying...");
      setTimeout(initMap, 100);
      return;
    }

    try {
      console.log("Starting map initialization...");
      setIsLoading(true);
      setError(null);
      setDebugInfo("🚀 Starting initialization...");

      await loadGoogleMapsScript();
      console.log("Google Maps script loaded");

      const location = await getUserLocation();
      console.log("Got user location:", location);
      setDebugInfo("📍 Creating map instance...");

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

      console.log("Map created");
      setDebugInfo("🗺️ Map created, adding marker...");

      const marker = new window.google.maps.Marker({
        position: location,
        map: map,
        draggable: true,
        title: "Drag to select your exact location",
        animation: window.google.maps.Animation.DROP,
      });

      console.log("Marker added");
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
      // setDebugInfo("✅ Map ready!");
      console.log("Map initialization complete");

      await handleLocationChange(location.lat, location.lng);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load map";
      console.error("Map initialization error:", err);
      setError(errorMessage);
      setDebugInfo(`❌ Error: ${errorMessage}`);
      setIsLoading(false);
    }
  }, [handleLocationChange]);

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
    console.log("🔥 useEffect TRIGGERED - Component mounted");
    console.log("📦 mapRef.current:", mapRef.current);
    console.log("🚀 Calling initMap...");

    const timer = setTimeout(() => {
      console.log("⏰ Timer fired, calling initMap");
      initMap();
    }, 500);

    return () => {
      console.log("🧹 Component unmounting, cleaning up...");
      clearTimeout(timer);
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  console.log(
    "🎬 RENDERING GoogleMapPicker, isLoading:",
    isLoading,
    "error:",
    error
  );

  return (
    <div className="space-y-4">
      {/* API Key Check */}

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

      {/* Debug Info Box */}
      {/* {debugInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-mono text-blue-800">{debugInfo}</p>
          </div>
        </div>
      )} */}

      <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
        {/* Map container - ALWAYS RENDERED */}
        <div
          ref={mapRef}
          className="h-96 w-full bg-gray-100"
          style={{ display: isLoading || error ? "none" : "block" }}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 h-96 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-orange-600" />
              <p className="text-sm text-gray-600">Loading map...</p>
              <p className="text-xs text-gray-400 mt-2">{debugInfo}</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="h-96 flex items-center justify-center bg-gray-50">
            <div className="text-center p-4 max-w-md">
              <div className="text-red-500 mb-2 text-2xl">⚠️</div>
              <p className="text-sm text-red-600 font-medium mb-2">
                Map failed to load
              </p>
              <p className="text-xs text-red-500 mb-3">{error}</p>
              <div className="bg-red-50 border border-red-200 rounded p-3 text-left mb-3">
                <p className="text-xs font-semibold text-red-800 mb-2">
                  Quick Fixes:
                </p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• Check .env file has VITE_GOOGLE_MAPS_API_KEY</li>
                  <li>• Restart dev server after adding API key</li>
                  <li>• Enable Maps JavaScript API in Google Cloud</li>
                  <li>• Check browser console (F12) for errors</li>
                  <li>• Verify billing is enabled on Google Cloud</li>
                </ul>
              </div>
              <Button onClick={initMap} className="mt-2" size="sm">
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Instruction overlay - shown when map is loaded */}
        {!isLoading && !error && (
          <div className="absolute top-4 left-4 right-4 z-10">
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
