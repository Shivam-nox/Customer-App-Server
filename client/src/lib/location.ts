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
 * Check if coordinates are within Bangalore bounds
 */
export const isWithinBangalore = (coordinates: LocationCoordinates): boolean => {
  const { latitude, longitude } = coordinates;
  
  // Approximate bounds for Bangalore
  const bangaloreBounds = {
    north: 13.1986,
    south: 12.7343,
    east: 77.8867,
    west: 77.3115
  };

  return (
    latitude >= bangaloreBounds.south &&
    latitude <= bangaloreBounds.north &&
    longitude >= bangaloreBounds.west &&
    longitude <= bangaloreBounds.east
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