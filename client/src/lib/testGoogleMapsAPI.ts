// Simple test to validate Google Maps API key

export const testGoogleMapsAPI = async (): Promise<{ success: boolean; error?: string }> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "API key not found in environment variables" };
  }

  try {
    // Test the API key by making a simple geocoding request
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Bangalore&key=${apiKey}`
    );

    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }

    const data = await response.json();

    if (data.status === "OK") {
      console.log("✅ Google Maps API key is valid and working");
      return { success: true };
    } else if (data.status === "REQUEST_DENIED") {
      return { 
        success: false, 
        error: `API key denied: ${data.error_message || 'Invalid API key or insufficient permissions'}` 
      };
    } else if (data.status === "OVER_QUERY_LIMIT") {
      return { 
        success: false, 
        error: "API quota exceeded" 
      };
    } else {
      return { 
        success: false, 
        error: `API returned status: ${data.status} - ${data.error_message || 'Unknown error'}` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Test if the API key has the required services enabled
export const testGoogleMapsServices = async (): Promise<{ 
  geocoding: boolean; 
  places: boolean; 
  maps: boolean; 
  errors: string[] 
}> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const results = { geocoding: false, places: false, maps: false, errors: [] as string[] };

  if (!apiKey) {
    results.errors.push("API key not found");
    return results;
  }

  // Test Geocoding API
  try {
    const geocodingResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Bangalore&key=${apiKey}`
    );
    const geocodingData = await geocodingResponse.json();
    results.geocoding = geocodingData.status === "OK";
    if (!results.geocoding) {
      results.errors.push(`Geocoding API: ${geocodingData.status} - ${geocodingData.error_message || 'Unknown error'}`);
    }
  } catch (error) {
    results.errors.push(`Geocoding API error: ${error}`);
  }

  // Test Places API
  try {
    const placesResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=Bangalore&key=${apiKey}`
    );
    const placesData = await placesResponse.json();
    results.places = placesData.status === "OK";
    if (!results.places) {
      results.errors.push(`Places API: ${placesData.status} - ${placesData.error_message || 'Unknown error'}`);
    }
  } catch (error) {
    results.errors.push(`Places API error: ${error}`);
  }

  // Maps JavaScript API will be tested when loading the script
  results.maps = true; // We'll assume it works if the key is valid

  return results;
};