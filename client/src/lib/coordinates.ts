/**
 * Coordinate management utilities
 * Helps with storing, validating, and using GPS coordinates
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Validate if coordinates are valid GPS coordinates
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return (
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat: number, lng: number, precision: number = 6): string => {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get Google Maps URL for coordinates
 */
export const getGoogleMapsUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

/**
 * Get directions URL between two coordinates
 */
export const getDirectionsUrl = (
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): string => {
  return `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`;
};

/**
 * Parse coordinate string to numbers
 */
export const parseCoordinates = (latStr?: string, lngStr?: string): Coordinates | null => {
  if (!latStr || !lngStr) return null;
  
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  
  if (!isValidCoordinates(lat, lng)) return null;
  
  return { latitude: lat, longitude: lng };
};

/**
 * Get coordinate accuracy description
 */
export const getAccuracyDescription = (accuracy?: number): string => {
  if (!accuracy) return "Unknown accuracy";
  
  if (accuracy <= 5) return "Very high accuracy (±5m)";
  if (accuracy <= 10) return "High accuracy (±10m)";
  if (accuracy <= 50) return "Good accuracy (±50m)";
  if (accuracy <= 100) return "Moderate accuracy (±100m)";
  return "Low accuracy (±" + Math.round(accuracy) + "m)";
};