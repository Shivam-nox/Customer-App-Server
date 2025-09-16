/**
 * Geocoding service using Nominatim (OpenStreetMap) API
 * Converts addresses to latitude/longitude coordinates
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  display_name: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  place_id: string;
  importance: number;
}

/**
 * Geocode an address using Nominatim API
 * @param address - The complete address to geocode
 * @returns Promise with coordinates or null if failed
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    // Build the complete address string
    const addressQuery = encodeURIComponent(address.trim());
    
    // Nominatim API endpoint
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${addressQuery}&limit=1&addressdetails=1&countrycodes=in`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Zapygo-App/1.0', // Required by Nominatim
      },
    });
    
    if (!response.ok) {
      console.error('Geocoding API request failed:', response.status);
      return null;
    }
    
    const data: NominatimResponse[] = await response.json();
    
    if (data.length === 0) {
      console.warn('No geocoding results found for address:', address);
      return null;
    }
    
    const result = data[0];
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name,
    };
    
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Build a complete address string from form data
 * @param addressData - Form data containing address components
 * @returns Complete address string for geocoding
 */
export function buildAddressString(addressData: {
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
}): string {
  const parts = [
    addressData.addressLine1,
    addressData.addressLine2,
    addressData.landmark,
    addressData.area,
    addressData.city,
    addressData.state,
    addressData.pincode,
    'India'
  ].filter(part => part && part.trim().length > 0);
  
  return parts.join(', ');
}