import { useEffect, useRef, useState, useCallback } from "react";

// Declare global google types
declare global {
  interface Window {
    google: any;
  }
}

// Simple direct Google Maps loader
const loadGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    // Check if script is already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("Google Maps loading timeout"));
      }, 10000);
      return;
    }

    // Create script
    const script = document.createElement("script");
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      reject(new Error("Google Maps API key not found"));
      return;
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait a bit for the API to be fully ready
      setTimeout(() => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          reject(new Error("Google Maps API not ready after script load"));
        }
      }, 100);
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google Maps script"));
    };

    document.head.appendChild(script);
  });
};

interface GoogleTrackingMapProps {
  deliveryAddress: string;
  orderStatus: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
}

interface Location {
  lat: number;
  lng: number;
  name: string;
}

// Define exact locations
const IOCL_TERMINAL: Location = {
  lat: 12.985612,
  lng: 77.838707,
  name: "IOCL Bangalore Terminal Devanagonthi",
};

// Common Bangalore delivery areas - realistic coordinates
const DELIVERY_LOCATIONS: Record<string, Location> = {
  koramangala: { lat: 12.9352, lng: 77.6245, name: "Koramangala" },
  "indira nagar": { lat: 12.9719, lng: 77.6412, name: "Indira Nagar" },
  "mg road": { lat: 12.9716, lng: 77.5946, name: "MG Road" },
  "electronic city": { lat: 12.8456, lng: 77.6603, name: "Electronic City" },
  whitefield: { lat: 12.9698, lng: 77.75, name: "Whitefield" },
  jayanagar: { lat: 12.9237, lng: 77.5937, name: "Jayanagar" },
  "btm layout": { lat: 12.9165, lng: 77.6101, name: "BTM Layout" },
  "hsr layout": { lat: 12.9116, lng: 77.637, name: "HSR Layout" },
  sarjapur: { lat: 12.901, lng: 77.6874, name: "Sarjapur" },
  marathahalli: { lat: 12.9591, lng: 77.6974, name: "Marathahalli" },
};

export default function GoogleTrackingMap({
  deliveryAddress,
  orderStatus,
  deliveryLatitude,
  deliveryLongitude,
}: GoogleTrackingMapProps) {
  console.log("🎨 GoogleTrackingMap RENDERED");
  console.log("📦 Props:", {
    deliveryAddress,
    orderStatus,
    deliveryLatitude,
    deliveryLongitude,
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const sourceMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [driverPosition, setDriverPosition] = useState<Location>(IOCL_TERMINAL);

  // Phase 1: Only show customer location until driver is assigned
  const showDriverTracking =
    orderStatus === "in_transit" || orderStatus === "delivered";
  console.log("🚛 Show driver tracking:", showDriverTracking);

  // Get destination based on coordinates or delivery address
  const getDestination = useCallback((): Location => {
    console.log("📍 getDestination called");
    console.log("   - deliveryLatitude:", deliveryLatitude);
    console.log("   - deliveryLongitude:", deliveryLongitude);
    console.log("   - deliveryAddress:", deliveryAddress);

    // Use provided coordinates if available
    if (deliveryLatitude && deliveryLongitude) {
      const location = {
        lat: deliveryLatitude,
        lng: deliveryLongitude,
        name: "Customer Location",
      };
      console.log("✅ Using GPS coordinates:", location);
      return location;
    }

    // Fallback to address-based matching
    const addressLower = deliveryAddress.toLowerCase();
    console.log("🔍 Trying address matching for:", addressLower);

    // Try to match with known locations
    for (const [key, location] of Object.entries(DELIVERY_LOCATIONS)) {
      if (addressLower.includes(key)) {
        console.log("✅ Matched location:", key, location);
        return location;
      }
    }

    // Default to Koramangala for unknown addresses
    console.log("⚠️ No match found, using default Koramangala");
    return DELIVERY_LOCATIONS["koramangala"];
  }, [deliveryAddress, deliveryLatitude, deliveryLongitude]);

  const destination = getDestination();
  console.log("🎯 Final destination:", destination);

  // Calculate route path (simplified straight line with some curve)
  const getRoutePath = useCallback((): any[] => {
    const startLat = IOCL_TERMINAL.lat;
    const startLng = IOCL_TERMINAL.lng;
    const endLat = destination.lat;
    const endLng = destination.lng;

    const steps = 20;
    const path: any[] = [];

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const lat = startLat + (endLat - startLat) * progress;
      const lng = startLng + (endLng - startLng) * progress;

      // Add slight curve for more realistic route
      const curve = Math.sin(progress * Math.PI) * 0.01;
      path.push(new window.google.maps.LatLng(lat + curve, lng + curve));
    }

    return path;
  }, [destination]);

  // Simulate driver movement
  useEffect(() => {
    if (orderStatus === "in_transit" && mapInstanceRef.current) {
      const routePath = getRoutePath();
      let step = 0;
      const totalSteps = routePath.length - 1;

      intervalRef.current = setInterval(() => {
        if (step < totalSteps) {
          step++;
          const newPosition = routePath[step];
          const newDriverPosition = {
            lat: newPosition.lat(),
            lng: newPosition.lng(),
            name: "Driver Location",
          };

          setDriverPosition(newDriverPosition);

          if (driverMarkerRef.current) {
            driverMarkerRef.current.setPosition(newPosition);
          }
        } else {
          // Driver reached destination
          setDriverPosition(destination);
          if (driverMarkerRef.current) {
            driverMarkerRef.current.setPosition({
              lat: destination.lat,
              lng: destination.lng,
            });
          }
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }, 3000); // Update every 3 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else if (orderStatus === "delivered") {
      setDriverPosition(destination);
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setPosition({
          lat: destination.lat,
          lng: destination.lng,
        });
      }
    }
  }, [orderStatus, destination, getRoutePath]);

  // Initialize map on component mount - ONLY ONCE
  useEffect(() => {
    console.log("🔥 useEffect triggered - MOUNT ONLY");
    console.log("   - mapRef.current (immediate):", mapRef.current);

    let isMounted = true;

    // Add delay to ensure DOM is ready
    const timer = setTimeout(async () => {
      console.log("⏰ Timer fired - checking mapRef again");
      console.log("   - mapRef.current (after delay):", mapRef.current);

      if (!isMounted) {
        console.log("⚠️ Component unmounted, skipping init");
        return;
      }

      if (!mapRef.current) {
        console.error("❌ mapRef still null after delay!");
        setMapError("Map container not ready");
        setIsLoading(false);
        return;
      }

      console.log("✅ mapRef is ready, initializing map");

      try {
        setMapError(null);
        console.log("📡 Loading Google Maps...");
        await loadGoogleMaps();
        console.log("✅ Google Maps loaded");

        if (!mapRef.current || !isMounted) {
          console.error("❌ mapRef lost or unmounted");
          return;
        }
        console.log("✅ mapRef.current still exists");

        // Create map
        const mapCenter = showDriverTracking
          ? {
              lat: (IOCL_TERMINAL.lat + destination.lat) / 2,
              lng: (IOCL_TERMINAL.lng + destination.lng) / 2,
            }
          : { lat: destination.lat, lng: destination.lng };

        const mapZoom = showDriverTracking ? 11 : 15;

        console.log("🗺️ Creating map with:");
        console.log("   - center:", mapCenter);
        console.log("   - zoom:", mapZoom);

        const map = new window.google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: mapZoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        console.log("✅ Map created:", map);
        mapInstanceRef.current = map;

        // Phase 1: Only show source marker if driver tracking is active
        let sourceMarker = null;
        if (showDriverTracking) {
          sourceMarker = new window.google.maps.Marker({
            position: { lat: IOCL_TERMINAL.lat, lng: IOCL_TERMINAL.lng },
            map: map,
            title: "Fuel Terminal",
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="#2563eb" stroke="white" stroke-width="3"/>
                  <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">⛽</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 16),
            },
          });
          sourceMarkerRef.current = sourceMarker;
        }

        // Customer location marker - always shown
        console.log("📍 Creating customer marker at:", destination);
        const destinationMarker = new window.google.maps.Marker({
          position: { lat: destination.lat, lng: destination.lng },
          map: map,
          title: "Your Delivery Location",
          icon: {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#dc2626" stroke="white" stroke-width="3"/>
                <text x="20" y="26" text-anchor="middle" fill="white" font-size="20">📍</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20),
          },
          animation: window.google.maps.Animation.DROP,
        });

        console.log("✅ Customer marker created");
        destinationMarkerRef.current = destinationMarker;

        // Create info windows
        if (sourceMarker) {
          const sourceInfoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="text-align: center; padding: 8px;">
                <h3 style="margin: 0; font-weight: bold;">Fuel Terminal</h3>
                <p style="margin: 4px 0; font-size: 14px;">${IOCL_TERMINAL.name}</p>
                <p style="margin: 0; font-size: 12px; color: #666;">Source Location</p>
              </div>
            `,
          });

          sourceMarker.addListener("click", () => {
            sourceInfoWindow.open(map, sourceMarker);
          });
        }

        const destinationInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="text-align: center; padding: 10px;">
              <h3 style="margin: 0; font-weight: bold; color: #dc2626;">Your Delivery Location</h3>
              <p style="margin: 6px 0; font-size: 14px; font-weight: 500;">${
                destination.name
              }</p>
              <p style="margin: 0; font-size: 12px; color: #666;">${deliveryAddress}</p>
              ${
                !showDriverTracking
                  ? '<p style="margin: 6px 0 0 0; font-size: 11px; color: #f97316; font-weight: 500;">⏳ Waiting for driver assignment</p>'
                  : ""
              }
            </div>
          `,
        });

        destinationMarker.addListener("click", () => {
          destinationInfoWindow.open(map, destinationMarker);
        });

        // Auto-open info window for customer location in Phase 1
        if (!showDriverTracking) {
          setTimeout(() => {
            destinationInfoWindow.open(map, destinationMarker);
          }, 500);
        }

        // Phase 1: Only create driver marker when actually tracking
        if (showDriverTracking) {
          const driverMarker = new window.google.maps.Marker({
            position: { lat: driverPosition.lat, lng: driverPosition.lng },
            map: map,
            title: "Driver Location",
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="#16a34a" stroke="white" stroke-width="3"/>
                  <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">🚛</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 16),
            },
          });

          driverMarkerRef.current = driverMarker;

          const driverInfoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="text-align: center; padding: 8px;">
                <h3 style="margin: 0; font-weight: bold;">Driver Location</h3>
                <p style="margin: 4px 0; font-size: 14px;">
                  ${
                    orderStatus === "delivered"
                      ? "Delivered!"
                      : "En route to destination"
                  }
                </p>
                <p style="margin: 0; font-size: 12px; color: #666;">
                  Status: ${orderStatus.replace("_", " ")}
                </p>
              </div>
            `,
          });

          driverMarker.addListener("click", () => {
            driverInfoWindow.open(map, driverMarker);
          });

          // Create route polyline
          const routePath = getRoutePath();
          const routePolyline = new window.google.maps.Polyline({
            path: routePath,
            geodesic: true,
            strokeColor: "#2563eb",
            strokeOpacity: 0.7,
            strokeWeight: 4,
          });

          routePolyline.setMap(map);
          routePolylineRef.current = routePolyline;
        }

        // Fit map to show all markers
        const bounds = new window.google.maps.LatLngBounds();

        if (showDriverTracking) {
          // Show full route when driver is active
          bounds.extend({ lat: IOCL_TERMINAL.lat, lng: IOCL_TERMINAL.lng });
          bounds.extend({ lat: destination.lat, lng: destination.lng });
          if (driverMarkerRef.current) {
            bounds.extend({ lat: driverPosition.lat, lng: driverPosition.lng });
          }
          map.fitBounds(bounds);
        } else {
          // Phase 1: Just center on customer location with good zoom
          map.setCenter({ lat: destination.lat, lng: destination.lng });
          map.setZoom(15);
        }

        console.log("✅ Map initialization complete!");
        setIsLoading(false);
      } catch (error) {
        console.error("❌ Error initializing tracking map:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load tracking map";
        console.error("❌ Error message:", errorMessage);
        setMapError(errorMessage);
        setIsLoading(false);
      }
    }, 300); // Increased delay

    return () => {
      console.log("🧹 Component unmounting, cleaning up");
      isMounted = false;
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty array - only run once on mount

  console.log("🎬 RENDERING - isLoading:", isLoading, "mapError:", mapError);
  console.log("✅ Always rendering map container to keep ref stable");

  return (
    <div
      className="h-64 w-full rounded-lg overflow-hidden border border-gray-200 relative"
      data-testid="google-tracking-map"
    >
      {/* Map container - ALWAYS RENDERED to keep ref stable */}
      <div
        ref={mapRef}
        className="h-full w-full bg-gray-100"
        style={{ display: isLoading || mapError ? "none" : "block" }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading tracking map...</p>
            <p className="text-xs text-gray-400 mt-2">
              Destination: {destination.name} ({destination.lat.toFixed(4)},{" "}
              {destination.lng.toFixed(4)})
            </p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <p className="text-sm text-red-600 font-medium">
              Failed to load map
            </p>
            <p className="text-xs text-red-500 mt-1">{mapError}</p>
            <button
              onClick={() => {
                console.log("🔄 Retry button clicked - reloading page");
                window.location.reload();
              }}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
