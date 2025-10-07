# Quick Location Accuracy Test Guide

## Test Your Location Accuracy Now

### Step 1: Open the App
```bash
npm run dev
```

### Step 2: Navigate to Address Selection
Go to any page that uses the map (e.g., checkout, profile address)

### Step 3: Check Browser Console
Open DevTools (F12) and look for:
```
✅ Got GPS location: {lat: XX.XXXX, lng: YY.YYYY} Accuracy: 8 meters
```

The accuracy number tells you how precise the location is:
- **5-10 meters** = Excellent (GPS lock)
- **10-30 meters** = Good (GPS with some interference)
- **50-100 meters** = Fair (Network/WiFi location)
- **100+ meters** = Poor (IP-based location)

### Step 4: Verify Your Location
1. Click "Use My Location" button
2. Check if the marker appears at your actual location
3. Compare with your known address

### Step 5: Test Manual Adjustment
1. Drag the marker to a nearby location
2. Verify the address updates correctly
3. Check that pincode and area are accurate

## What You Should See

### On Desktop (with GPS)
```
📡 Requesting GPS location...
✅ GPS location acquired (±8m accuracy)
📍 Location: Your actual address
```

### On Desktop (without GPS)
```
⚠️ GPS not supported, using default location
📍 Location: Bangalore center (12.9716, 77.5946)
```

### On Mobile
```
📡 Requesting GPS location...
✅ GPS location acquired (±5m accuracy)
📍 Location: Your exact location
```

## Troubleshooting

### "Location permission denied"
**Fix:** Allow location access in browser settings
- Chrome: Settings → Privacy → Site Settings → Location
- Firefox: Preferences → Privacy → Permissions → Location
- Safari: Preferences → Websites → Location

### "Location unavailable"
**Possible causes:**
1. GPS disabled on device
2. Indoor location (weak GPS signal)
3. VPN blocking location
4. Browser doesn't support geolocation

**Fix:** 
- Enable GPS/Location Services
- Move near a window for better GPS signal
- Disable VPN temporarily
- Use a modern browser

### "Location outside Bangalore"
**Expected behavior:** App only serves Bangalore
**What happens:** Shows Bangalore center + warning message

### Marker not at exact location
**Possible causes:**
1. GPS accuracy is low (check console for accuracy value)
2. Building/indoor interference
3. Using network location instead of GPS

**Fix:**
- Wait a few seconds for GPS to improve
- Move to an open area
- Manually drag marker to correct position

## Compare with Google Maps

1. Open Google Maps on same device
2. Click "My Location" button
3. Compare the coordinates with your app
4. They should be within 10-20 meters

## Expected Accuracy by Device

| Device Type | Expected Accuracy | Notes |
|-------------|------------------|-------|
| Mobile (outdoor) | 5-10m | Best accuracy |
| Mobile (indoor) | 10-30m | GPS signal weakened |
| Desktop (GPS) | 10-20m | If device has GPS |
| Desktop (WiFi) | 50-100m | Network-based location |
| Desktop (IP) | 1-5km | Least accurate |

## Production Checklist

Before going live, verify:
- [ ] GPS location works on your phone
- [ ] Accuracy is under 20 meters
- [ ] Address is correctly detected
- [ ] Pincode is accurate
- [ ] Area/locality is correct
- [ ] Bangalore boundary validation works
- [ ] Manual marker adjustment works
- [ ] "Use My Location" button works
- [ ] Error messages are user-friendly
- [ ] Loading states are smooth

## API Key Security Check

⚠️ **IMPORTANT:** Before production, secure your API key:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Under "Application restrictions":
   - Select "HTTP referrers"
   - Add: `https://yourdomain.com/*`
   - Add: `https://*.yourdomain.com/*`
4. Under "API restrictions":
   - Select "Restrict key"
   - Enable only:
     - Maps JavaScript API
     - Geocoding API
5. Click "Save"

## Quick Accuracy Test Commands

### Check if GPS is working
```javascript
// Paste in browser console
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('GPS:', pos.coords.latitude, pos.coords.longitude, 'Accuracy:', pos.coords.accuracy + 'm'),
  (err) => console.error('GPS Error:', err.message),
  { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
);
```

### Check Google Maps API
```javascript
// Paste in browser console (after map loads)
console.log('Google Maps loaded:', !!window.google?.maps);
console.log('API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.substring(0, 10) + '...');
```

## Need Help?

If location is still inaccurate:
1. Check browser console for errors
2. Verify GPS is enabled on device
3. Try on different device/browser
4. Check if you're in Bangalore area
5. Manually adjust marker as fallback

---

**Current Status:** ✅ High-accuracy GPS enabled
**Expected Accuracy:** 5-10 meters (outdoor), 10-30 meters (indoor)
**Fallback:** Manual marker adjustment always available
