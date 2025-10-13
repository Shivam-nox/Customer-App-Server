/**
 * Geocoding service using Google Maps Geocoding API
 * Converts addresses to latitude/longitude coordinates
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  display_name: string;
}

/**
 * Geocode an address using Google Maps Geocoding API
 * @param address - The complete address to geocode
 * @returns Promise with coordinates or null if failed
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const addressQuery = encodeURIComponent(address.trim());
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return null;
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${addressQuery}&key=${apiKey}&region=in&components=country:IN`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Geocoding API request failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn('No results found for address:', address);
      return null;
    }
    
    const result = data.results[0];
    const coordinates = {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      display_name: result.formatted_address,
    };
    
    return coordinates;
    
  } catch (error) {
    console.error('Error during geocoding:', error);
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
  console.log('Entering Build Address String Function')
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