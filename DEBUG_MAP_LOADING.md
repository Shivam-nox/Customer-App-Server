# Debug Map Loading - Console Logs Added

## 🔍 What Was Added

### 1. Component Render Logs
- `🎨 GoogleMapPicker COMPONENT RENDERED` - Shows when component renders
- `📊 STATE:` - Shows current state (isLoading, error, currentLocation, debugInfo)
- `🎬 RENDERING GoogleMapPicker` - Shows render with current state

### 2. Script Loading Logs
- `🔄 loadGoogleMapsScript CALLED` - When script loading starts
- `📡 Checking if Google Maps already loaded...` - Checking existing script
- `API Key present:` - Shows if API key exists
- `API Key length:` - Shows key length
- `✅ API key found, loading script...` - Key validation passed
- `📥 Creating Google Maps script tag...` - Creating new script
- `Script tag appended to head` - Script added to DOM

### 3. Location Detection Logs
- `🌍 getUserLocation CALLED` - When location detection starts
- `✅ Returning hardcoded Bangalore center:` - Using hardcoded value
- `📍 Using Bangalore center (12.9716, 77.5946)` - Exact coordinates

### 4. Map Initialization Logs
- `🔥 useEffect TRIGGERED` - Component mounted
- `📦 mapRef.current:` - Shows if map container exists
- `🚀 Calling initMap...` - Starting initialization
- `⏰ Timer fired, calling initMap` - After 500ms delay
- `Starting map initialization...` - initMap function started
- `Google Maps script loaded` - Script loaded successfully
- `Got user location:` - Location retrieved
- `📍 Creating map instance...` - Creating map
- `Map created` - Map instance created
- `🗺️ Map created, adding marker...` - Adding marker
- `Marker added` - Marker created

### 5. Visual Debug Info
- **Yellow Box**: Shows API key status
- **Blue Box**: Shows current debug step
- **Loading State**: Shows spinner and message
- **Error State**: Shows error with retry button

## 🎯 Hardcoded Values for Testing

### Location
```javascript
const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946 };
```

**getUserLocation now returns:**
- Always returns Bangalore center (12.9716, 77.5946)
- No GPS detection (commented out)
- Instant response (100ms delay)

## 📋 How to Test

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Open Browser Console
- Press F12
- Go to Console tab
- Clear console

### 3. Navigate to Add Address
- Go to Profile → Add Address
- Watch console logs

### 4. Expected Console Output

```
🎨 GoogleMapPicker COMPONENT RENDERED
📊 STATE: { isLoading: true, error: null, hasCurrentLocation: false, debugInfo: "Component initialized" }
🎬 RENDERING GoogleMapPicker, isLoading: true error: null
🔥 useEffect TRIGGERED - Component mounted
📦 mapRef.current: <div>
🚀 Calling initMap...
⏰ Timer fired, calling initMap
Starting map initialization...
🔄 loadGoogleMapsScript CALLED
📡 Checking if Google Maps already loaded...
API Key present: true
API Key length: 39
✅ API key found, loading script...
📥 Creating Google Maps script tag...
Script tag appended to head
Google Maps script loaded
🌍 getUserLocation CALLED - USING HARDCODED BANGALORE CENTER FOR TESTING
✅ Returning hardcoded Bangalore center: {lat: 12.9716, lng: 77.5946}
Got user location: {lat: 12.9716, lng: 77.5946}
📍 Creating map instance...
Map created
🗺️ Map created, adding marker...
Marker added
```

### 5. Check Network Tab
Should see:
```
GET https://maps.googleapis.com/maps/api/js?key=...&libraries=places
Status: 200
```

## 🐛 Troubleshooting

### If No Logs Appear
**Problem:** Component not rendering
**Check:**
- Is AddressManager rendering?
- Is GoogleMapPicker imported correctly?
- Check browser console for React errors

### If Logs Stop at "Component mounted"
**Problem:** useEffect not running
**Check:**
- Is initMap function defined?
- Check for JavaScript errors
- Try hard refresh (Cmd+Shift+R)

### If Logs Stop at "loadGoogleMapsScript CALLED"
**Problem:** API key issue
**Check:**
- Yellow box shows "API Key: ✅ Present"?
- Check .env file has VITE_GOOGLE_MAPS_API_KEY
- Restart dev server

### If Logs Stop at "Script tag appended"
**Problem:** Script not loading from Google
**Check:**
- Network tab for failed requests
- Check API key is valid
- Check internet connection
- Try different browser

### If Logs Stop at "Creating map instance"
**Problem:** Map container issue
**Check:**
- Is mapRef.current not null?
- Is the div rendered?
- Check for CSS hiding the element

## 📊 Debug Info Display

### Yellow Box (Top)
Shows API key status:
- ✅ Present - API key found
- ❌ Missing - API key not found
- Shows first 10 characters of key

### Blue Box (Below)
Shows current step:
- "Component initialized"
- "Loading Google Maps script..."
- "✅ API key found, loading script..."
- "📍 Using Bangalore center (12.9716, 77.5946)"
- "📍 Creating map instance..."
- "🗺️ Map created, adding marker..."

### Map Container
- Shows loading spinner while isLoading=true
- Shows error message if error exists
- Shows map when loaded

## 🎯 What to Look For

### Success Path:
1. Component renders
2. useEffect triggers
3. initMap called
4. Script loads
5. Location retrieved (hardcoded)
6. Map created
7. Marker added
8. Map visible!

### Common Failure Points:
1. **API key missing** - Check .env
2. **Script fails to load** - Check network
3. **Map container not ready** - Check DOM
4. **Google Maps API error** - Check API key validity

## 🔧 Next Steps

Once we see where it fails:
1. If API key issue → Fix .env
2. If script loading issue → Check network/API key
3. If map creation issue → Check container/DOM
4. If everything logs but no map → Check CSS/visibility

## 📝 To Remove Debug Code Later

Search for:
- `console.log` statements
- Yellow API key box
- Blue debug info box
- Hardcoded location in getUserLocation

Replace getUserLocation with original GPS detection code.
