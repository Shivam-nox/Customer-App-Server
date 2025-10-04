/**
 * Location Detection Service
 * Provides geolocation and reverse geocoding functionality like Swiggy/Zomato
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface AddressComponents {
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  formattedAddress: string;
}

export interface LocationError {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';
}

/**
 * Get user's current location using browser geolocation API
 */
export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser',
        type: 'NOT_SUPPORTED'
      } as LocationError);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 300000, // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let errorType: LocationError['type'];
        let errorMessage: string;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = 'PERMISSION_DENIED';
            errorMessage = 'Location access denied by user. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorType = 'POSITION_UNAVAILABLE';
            errorMessage = 'Location information is unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorType = 'TIMEOUT';
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorType = 'POSITION_UNAVAILABLE';
            errorMessage = 'An unknown error occurred while retrieving location.';
            break;
        }

        reject({
          code: error.code,
          message: errorMessage,
          type: errorType
        } as LocationError);
      },
      options
    );
  });
};

/**
 * Reverse geocode coordinates to get address components
 * Uses multiple geocoding services for better accuracy
 */
export const reverseGeocode = async (coordinates: LocationCoordinates): Promise<AddressComponents> => {
  const { latitude, longitude } = coordinates;

  try {
    // Try Nominatim (OpenStreetMap) first - free and reliable
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Zapygo-App/1.0'
        }
      }
    );

    if (nominatimResponse.ok) {
      const data = await nominatimResponse.json();
      return parseNominatimResponse(data);
    }
  } catch (error) {
    console.warn('Nominatim geocoding failed:', error);
  }

  // Fallback to a simpler approach if Nominatim fails
  try {
    // Try using a different service or return a basic structure
    return await fallbackGeocode(coordinates);
  } catch (error) {
    throw new Error('Unable to determine address from location. Please enter manually.');
  }
};

/**
 * Parse Nominatim (OpenStreetMap) response to extract address components
 */
const parseNominatimResponse = (data: any): AddressComponents => {
  const address = data.address || {};
  
  // Extract components with fallbacks
  const houseNumber = address.house_number || '';
  const road = address.road || address.street || '';
  const neighbourhood = address.neighbourhood || address.suburb || address.residential || '';
  const locality = address.locality || address.village || address.town || '';
  const city = address.city || address.municipality || 'Bangalore';
  const state = address.state || 'Karnataka';
  const postcode = address.postcode || '';
  
  // Build address lines
  let addressLine1 = '';
  let addressLine2 = '';
  
  if (houseNumber && road) {
    addressLine1 = `${houseNumber}, ${road}`;
    addressLine2 = neighbourhood || locality;
  } else if (road) {
    addressLine1 = road;
    addressLine2 = neighbourhood || locality;
  } else {
    addressLine1 = neighbourhood || locality || 'Address not found';
  }

  // Determine area (most specific locality)
  const area = neighbourhood || locality || address.suburb || 'Unknown Area';
  
  // Look for landmarks
  const landmark = address.amenity || address.shop || address.building || '';

  return {
    addressLine1: addressLine1.trim(),
    addressLine2: addressLine2.trim(),
    landmark: landmark.trim(),
    area: area.trim(),
    city: city.trim(),
    state: state.trim(),
    pincode: postcode.trim(),
    formattedAddress: data.display_name || 'Address detected via GPS'
  };
};

/**
 * Fallback geocoding when primary service fails
 */
const fallbackGeocode = async (coordinates: LocationCoordinates): Promise<AddressComponents> => {
  // This is a basic fallback - in production you might want to use Google Maps API
  // or another service as backup
  
  return {
    addressLine1: 'GPS Location Detected',
    addressLine2: `Lat: ${coordinates.latitude.toFixed(6)}, Lng: ${coordinates.longitude.toFixed(6)}`,
    landmark: '',
    area: 'Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001', // Default Bangalore pincode
    formattedAddress: `Location: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
  };
};

/**
 * Bangalore pincode ranges for accurate service area validation
 * Based on official India Post pincode allocation
 */
const BANGALORE_PINCODE_RANGES = [
  { start: 560001, end: 560099 }, // Central Bangalore
  { start: 560100, end: 560129 }, // Extended areas
  { start: 562001, end: 562130 }, // Bangalore Rural (some areas)
];

/**
 * Check if coordinates are within Bangalore using multiple methods
 * Method 1: Reverse geocoding to check city name (most accurate)
 * Method 2: Pincode validation (very reliable)
 * Method 3: Distance from city center (fallback)
 * Method 4: Rough bounding box (last resort)
 */
export const isWithinBangalore = async (coordinates: LocationCoordinates): Promise<boolean> => {
  const { latitude, longitude } = coordinates;
  
  try {
    // Method 1: Use reverse geocoding to check if city is Bangalore
    const addressComponents = await reverseGeocode(coordinates);
    const city = addressComponents.city.toLowerCase();
    const pincode = addressComponents.pincode;
    
    // Check for various Bangalore name variations
    const bangaloreNames = [
      'bangalore', 'bengaluru', 'bangaluru', 'bengalore',
      'bangalore urban', 'bengaluru urban', 'bbmp'
    ];
    
    const isBangaloreByName = bangaloreNames.some(name => 
      city.includes(name) || name.includes(city)
    );
    
    // Method 2: Validate pincode if available
    let isBangaloreByPincode = false;
    if (pincode && pincode.length === 6) {
      const pincodeNum = parseInt(pincode);
      isBangaloreByPincode = BANGALORE_PINCODE_RANGES.some(range => 
        pincodeNum >= range.start && pincodeNum <= range.end
      );
    }
    
    if (isBangaloreByName || isBangaloreByPincode) {
      console.log('✅ Location confirmed as Bangalore:', {
        city,
        pincode,
        byName: isBangaloreByName,
        byPincode: isBangaloreByPincode
      });
      return true;
    }
    
    // Method 3: Check distance from Bangalore city center (Vidhana Soudha)
    const bangaloreCenterLat = 12.9716;
    const bangaloreCenterLng = 77.5946;
    const distanceKm = calculateDistance(
      latitude, longitude, 
      bangaloreCenterLat, bangaloreCenterLng
    );
    
    // If within 40km of city center, likely Bangalore metro area
    if (distanceKm <= 40) {
      console.log('✅ Location within 40km of Bangalore center:', distanceKm.toFixed(2), 'km');
      return true;
    }
    
    console.log('❌ Location outside Bangalore area:', {
      city,
      pincode,
      distanceKm: distanceKm.toFixed(2)
    });
    return false;
    
  } catch (error) {
    console.warn('Geocoding failed, using fallback bounding box method');
    
    // Method 4: Fallback to rough bounding box (more conservative)
    const bangaloreBounds = {
      north: 13.20,   // Includes Devanahalli area
      south: 12.70,   // Includes Bannerghatta
      east: 77.90,    // Includes Whitefield
      west: 77.30     // Includes Peenya/Rajajinagar
    };

    const withinBounds = (
      latitude >= bangaloreBounds.south &&
      latitude <= bangaloreBounds.north &&
      longitude >= bangaloreBounds.west &&
      longitude <= bangaloreBounds.east
    );
    
    console.log('Using fallback bounding box method:', withinBounds);
    return withinBounds;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Validate if a pincode belongs to Bangalore
 */
export const isValidBangalorePincode = (pincode: string): boolean => {
  if (!pincode || pincode.length !== 6) {
    return false;
  }
  
  const pincodeNum = parseInt(pincode);
  if (isNaN(pincodeNum)) {
    return false;
  }
  
  return BANGALORE_PINCODE_RANGES.some(range => 
    pincodeNum >= range.start && pincodeNum <= range.end
  );
};

/**
 * Get user-friendly error message for location errors
 */
export const getLocationErrorMessage = (error: LocationError): string => {
  switch (error.type) {
    case 'PERMISSION_DENIED':
      return 'Please allow location access in your browser settings to use this feature.';
    case 'POSITION_UNAVAILABLE':
      return 'Unable to detect your location. Please check your GPS settings.';
    case 'TIMEOUT':
      return 'Location detection timed out. Please try again.';
    case 'NOT_SUPPORTED':
      return 'Location detection is not supported by your browser.';
    default:
      return 'Unable to detect location. Please enter address manually.';
  }
};