import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiNGRjAwMDAiLz4KPHBhdGggZD0iTTEyLjUgNDBMMjUgMTJIMFoiIGZpbGw9IiNGRjAwMDAiLz4KPC9zdmc+',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiNGRjAwMDAiLz4KPHBhdGggZD0iTTEyLjUgNDBMMjUgMTJIMFoiIGZpbGw9IiNGRjAwMDAiLz4KPC9zdmc+',
  shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjIwLjUiIGN5PSIyMC41IiByeD0iMjAuNSIgcnk9IjIwLjUiIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4yIi8+Cjwvc3ZnPg==',
});

interface TrackingMapProps {
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
  name: "IOCL Bangalore Terminal Devanagonthi"
};

// Common Bangalore delivery areas - realistic coordinates
const DELIVERY_LOCATIONS: Record<string, Location> = {
  "koramangala": { lat: 12.9352, lng: 77.6245, name: "Koramangala" },
  "indira nagar": { lat: 12.9719, lng: 77.6412, name: "Indira Nagar" },
  "mg road": { lat: 12.9716, lng: 77.5946, name: "MG Road" },
  "electronic city": { lat: 12.8456, lng: 77.6603, name: "Electronic City" },
  "whitefield": { lat: 12.9698, lng: 77.7500, name: "Whitefield" },
  "jayanagar": { lat: 12.9237, lng: 77.5937, name: "Jayanagar" },
  "btm layout": { lat: 12.9165, lng: 77.6101, name: "BTM Layout" },
  "hsr layout": { lat: 12.9116, lng: 77.6370, name: "HSR Layout" },
  "sarjapur": { lat: 12.9010, lng: 77.6874, name: "Sarjapur" },
  "marathahalli": { lat: 12.9591, lng: 77.6974, name: "Marathahalli" }
};

// Custom marker icons
const createCustomIcon = (color: string, symbol: string) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      ">
        <span style="
          color: white;
          font-size: 14px;
          font-weight: bold;
          transform: rotate(45deg);
        ">${symbol}</span>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

const sourceIcon = createCustomIcon('#2563eb', '⛽');
const destinationIcon = createCustomIcon('#dc2626', '📍');
const driverIcon = createCustomIcon('#16a34a', '🚛');

export default function TrackingMap({ 
  deliveryAddress, 
  orderStatus, 
  deliveryLatitude, 
  deliveryLongitude 
}: TrackingMapProps) {
  const [driverPosition, setDriverPosition] = useState<Location>(IOCL_TERMINAL);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get destination based on coordinates or delivery address
  const getDestination = (): Location => {
    // Use provided coordinates if available
    if (deliveryLatitude && deliveryLongitude) {
      return {
        lat: deliveryLatitude,
        lng: deliveryLongitude,
        name: "Customer Location"
      };
    }
    
    // Fallback to address-based matching
    const addressLower = deliveryAddress.toLowerCase();
    
    // Try to match with known locations
    for (const [key, location] of Object.entries(DELIVERY_LOCATIONS)) {
      if (addressLower.includes(key)) {
        return location;
      }
    }
    
    // Default to Koramangala for unknown addresses
    return DELIVERY_LOCATIONS["koramangala"];
  };

  const destination = getDestination();

  // Calculate route path (simplified straight line with some curve)
  const getRoutePath = (): [number, number][] => {
    const startLat = IOCL_TERMINAL.lat;
    const startLng = IOCL_TERMINAL.lng;
    const endLat = destination.lat;
    const endLng = destination.lng;
    
    const steps = 20;
    const path: [number, number][] = [];
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const lat = startLat + (endLat - startLat) * progress;
      const lng = startLng + (endLng - startLng) * progress;
      
      // Add slight curve for more realistic route
      const curve = Math.sin(progress * Math.PI) * 0.01;
      path.push([lat + curve, lng + curve]);
    }
    
    return path;
  };

  const routePath = getRoutePath();

  // Simulate driver movement
  useEffect(() => {
    if (orderStatus === "in_transit") {
      let step = 0;
      const totalSteps = routePath.length - 1;
      
      intervalRef.current = setInterval(() => {
        if (step < totalSteps) {
          step++;
          const [lat, lng] = routePath[step];
          setDriverPosition({ lat, lng, name: "Driver Location" });
        } else {
          // Driver reached destination
          setDriverPosition(destination);
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
    }
  }, [orderStatus, destination, routePath]);

  // Map bounds to show all locations
  const bounds: [[number, number], [number, number]] = [
    [
      Math.min(IOCL_TERMINAL.lat, destination.lat, driverPosition.lat) - 0.05,
      Math.min(IOCL_TERMINAL.lng, destination.lng, driverPosition.lng) - 0.05
    ],
    [
      Math.max(IOCL_TERMINAL.lat, destination.lat, driverPosition.lat) + 0.05,
      Math.max(IOCL_TERMINAL.lng, destination.lng, driverPosition.lng) + 0.05
    ]
  ];

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200" data-testid="tracking-map">
      <MapContainer
        bounds={bounds}
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Source Location - IOCL Terminal */}
        <Marker position={[IOCL_TERMINAL.lat, IOCL_TERMINAL.lng]} icon={sourceIcon}>
          <Popup>
            <div className="text-center">
              <h3 className="font-bold">Fuel Terminal</h3>
              <p className="text-sm">{IOCL_TERMINAL.name}</p>
              <p className="text-xs text-gray-600">Source Location</p>
            </div>
          </Popup>
        </Marker>

        {/* Destination Location */}
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>
            <div className="text-center">
              <h3 className="font-bold">Delivery Location</h3>
              <p className="text-sm">{destination.name}</p>
              <p className="text-xs text-gray-600">{deliveryAddress}</p>
            </div>
          </Popup>
        </Marker>

        {/* Driver Location */}
        {orderStatus !== "pending" && orderStatus !== "confirmed" && (
          <Marker position={[driverPosition.lat, driverPosition.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-center">
                <h3 className="font-bold">Driver Location</h3>
                <p className="text-sm">
                  {orderStatus === "delivered" ? "Delivered!" : "En route to destination"}
                </p>
                <p className="text-xs text-gray-600">
                  Status: {orderStatus.replace("_", " ")}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Path */}
        {orderStatus !== "pending" && orderStatus !== "confirmed" && (
          <Polyline
            positions={routePath}
            color="#2563eb"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
}