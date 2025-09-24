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
  console.log('🗺️ [GEOCODING] Starting geocoding for address:', address);
  
  try {
    // Build the complete address string
    const addressQuery = encodeURIComponent(address.trim());
    
    // Nominatim API endpoint
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${addressQuery}&limit=1&addressdetails=1&countrycodes=in`;
    
    console.log('🌐 [GEOCODING] Making request to URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Zapygo-App/1.0', // Required by Nominatim
      },
    });
    
    console.log('📡 [GEOCODING] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('💥 [GEOCODING] API request failed:', response.status);
      return null;
    }
    
    const data: NominatimResponse[] = await response.json();
    console.log('🔍 [GEOCODING] Raw API response:', data);
    
    if (data.length === 0) {
      console.warn('❌ [GEOCODING] No results found for address:', address);
      return null;
    }
    
    const result = data[0];
    const coordinates = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name,
    };
    
    console.log('✅ [GEOCODING] Success! Coordinates found:', coordinates);
    return coordinates;
    
  } catch (error) {
    console.error('💥 [GEOCODING] Error during geocoding:', error);
    return null;
  }
}

/**
 * Test function to verify geocoding with specific addresses
 * This will help debug geocoding issues in the console
 */
export async function testGeocoding() {
  console.log('🧪 [GEOCODING TEST] Starting geocoding tests...');
  
  const testAddresses = [
    'Kempegowda International Airport Bengaluru, near Devanahalli - 534320',
    'RMZ Infinity, Old Mardras Road, Sadanandanagar, Bennigana Halli, opposite Gopalan Signature Mall, 560016'
  ];
  
  for (const address of testAddresses) {
    console.log(`\n🔍 Testing address: ${address}`);
    const result = await geocodeAddress(address);
    console.log(`Result:`, result);
  }
}

// Expose test function globally for debugging
(window as any).testGeocoding = testGeocoding;

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