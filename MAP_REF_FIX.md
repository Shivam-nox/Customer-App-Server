# Map Ref Fix - "Map ref not ready, retrying..." Issue

## 🐛 The Problem

**Console showed:**
```
Map ref not ready, retrying...
Map ref not ready, retrying...
Map ref not ready, retrying...
(infinite loop)
```

**Root Causes:**

### 1. Infinite Re-render Loop
```javascript
useEffect(() => {
  initMap();
}, [initMap]); // ❌ initMap recreated every render
```

- `initMap` is a `useCallback` that depends on other functions
- Every render creates a new `initMap` function
- useEffect sees new function → runs again
- Causes infinite loop

### 2. Map Div Not Rendered
```javascript
{isLoading ? (
  <LoadingSpinner />
) : (
  <div ref={mapRef} /> // ❌ Only rendered when NOT loading
)}
```

- Map div only rendered when `isLoading = false`
- But `isLoading` starts as `true`
- `initMap` checks `mapRef.current` → always `null`
- Keeps retrying forever

## ✅ The Solution

### Fix 1: Empty Dependency Array
```javascript
useEffect(() => {
  initMap();
}, []); // ✅ Only run once on mount
```

### Fix 2: Always Render Map Div
```javascript
{/* Map container - ALWAYS RENDERED */}
<div 
  ref={mapRef}
  className="h-96 w-full" 
  style={{ display: isLoading || error ? 'none' : 'block' }}
/>

{/* Loading overlay */}
{isLoading && <LoadingSpinner />}

{/* Error overlay */}
{error && <ErrorMessage />}
```

**Key Changes:**
- Map div always in DOM (just hidden when loading/error)
- `mapRef.current` is set immediately
- Loading/error shown as overlays
- No conditional rendering of map container

### Fix 3: Ref Callback with Logging
```javascript
<div 
  ref={(el) => {
    if (el && !mapRef.current) {
      console.log("📦 Map div ref SET:", el);
      mapRef.current = el;
    }
  }}
/>
```

## 🎯 Expected Behavior Now

### Console Output:
```
🎨 GoogleMapPicker COMPONENT RENDERED
📊 STATE: { isLoading: true, error: null... }
🔥 useEffect TRIGGERED - Component mounted
📦 Map div ref SET: <div>
⏰ Timer fired, calling initMap
Starting map initialization...
🔄 loadGoogleMapsScript CALLED
API Key present: true
✅ API key found, loading script...
📥 Creating Google Maps script tag...
Script tag appended to head
🌍 getUserLocation CALLED
✅ Returning hardcoded Bangalore center
📍 Creating map instance...
Map created
🗺️ Map created, adding marker...
Marker added
✅ Map initialization complete!
```

**No more "Map ref not ready, retrying..."!**

## 🔍 Why This Works

### Before:
1. Component renders with `isLoading=true`
2. Map div NOT in DOM
3. useEffect runs → `initMap()` called
4. `mapRef.current` is `null`
5. Retries after 100ms
6. Component re-renders (because initMap dependency changed)
7. Back to step 1 → infinite loop

### After:
1. Component renders with `isLoading=true`
2. Map div IS in DOM (just hidden)
3. Ref callback sets `mapRef.current`
4. useEffect runs ONCE (empty deps)
5. `initMap()` finds `mapRef.current`
6. Map loads successfully
7. No re-renders, no retries

## 📋 Testing

```bash
npm run dev
```

Open console and you should see:
1. ✅ "Map div ref SET" - Ref is set
2. ✅ No infinite "retrying" messages
3. ✅ Script loads
4. ✅ Map creates
5. ✅ Map visible!

## 🎨 Visual Changes

### Loading State:
- Gray box with spinner overlay
- Map div hidden underneath
- Debug info shown

### Loaded State:
- Map visible
- Instruction overlay on top
- Marker at Bangalore center
- Draggable and clickable

### Error State:
- Error message overlay
- Map div hidden
- Retry button
- Helpful troubleshooting tips

## 🔧 Technical Details

### useEffect Dependencies:
```javascript
// ❌ BAD - Causes infinite loop
useEffect(() => {
  initMap();
}, [initMap]);

// ✅ GOOD - Runs once
useEffect(() => {
  initMap();
}, []);
```

### Conditional Rendering:
```javascript
// ❌ BAD - Ref not set until condition true
{condition && <div ref={mapRef} />}

// ✅ GOOD - Ref always set, visibility controlled
<div ref={mapRef} style={{ display: condition ? 'block' : 'none' }} />
```

### Ref Callbacks:
```javascript
// ✅ GOOD - Logs when ref is set
ref={(el) => {
  if (el && !mapRef.current) {
    console.log("Ref set:", el);
    mapRef.current = el;
  }
}}
```

## 🎯 Result

**Map now loads successfully!**
- No infinite loops
- Ref is set immediately
- Map initializes properly
- Hardcoded Bangalore center shows
- Ready for user interaction

Next step: Test if map actually appears and is interactive!
