# Invoice Download Debug Guide

## Issues Fixed:

### 1. **Multiple Button Loading Issue** ✅
**Problem**: When clicking one "Download Invoice" button, ALL buttons would start loading
**Cause**: Single global `useMutation` was shared across all orders
**Fix**: 
- **Order History**: Used `useState` with `Set<string>` to track individual order downloads
- **Track Order**: Used simple `useState` boolean for single order

### 2. **Better Error Handling** ✅
**Problem**: Generic "Failed to download invoice" errors
**Fix**: 
- Parse backend error messages properly
- Show specific error messages (e.g., "Invoice is only available for delivered orders")
- Added console logging for debugging

### 3. **Improved Download Logic** ✅
**Problem**: Poor error handling and duplicate downloads
**Fix**:
- Prevent duplicate downloads with state checks
- Better blob handling
- Proper cleanup of URLs
- More descriptive success messages

## How to Test:

### Prerequisites:
1. Make sure server is running: `npm run dev`
2. You need orders with status "delivered"

### Testing Steps:

1. **Create a delivered order** (if none exist):
```bash
# First, get existing orders
curl -H "x-user-id: a35ed64c-13ba-4d73-96fd-82f2f1b2d1e0" "http://localhost:3001/api/orders"

# If you have orders, manually mark one as delivered in the database
# Or use the admin driver assignment feature to complete the order flow
```

2. **Test Order History Page**:
   - Go to `/orders` 
   - Filter to "Delivered" orders
   - Click "Download Invoice" on any delivered order
   - Only that button should show loading
   - Should download PDF with proper filename

3. **Test Track Order Page**:
   - Go to `/track-order/{order-id}` for a delivered order
   - Should see green "Order Delivered Successfully!" card
   - Click "Download Invoice" button
   - Should download PDF

### Expected Behavior:

✅ **Working**: Only the clicked button shows loading
✅ **Working**: Proper error messages for non-delivered orders  
✅ **Working**: PDF downloads with correct filename format
✅ **Working**: Success toast with order number
✅ **Working**: Console logging for debugging

### If Still Having Issues:

1. **Check browser console** for detailed error logs
2. **Check network tab** to see the actual API response
3. **Verify order status** is exactly "delivered" (not "Delivered")
4. **Check if payment exists** for the order (required for invoice)

### Manual API Test:
```bash
# Test invoice API directly
curl -H "x-user-id: a35ed64c-13ba-4d73-96fd-82f2f1b2d1e0" \
     "http://localhost:3001/api/orders/{ORDER_ID}/invoice" \
     --output test-invoice.pdf

# Check the response
file test-invoice.pdf
```

### Common Issues:

1. **"Invoice is only available for delivered orders"**
   - Order status is not "delivered"
   - Check order status in database

2. **"Payment information not found"**
   - Order doesn't have payment record
   - Check payments table

3. **"Order not found"**
   - Wrong order ID
   - Order doesn't belong to the user

4. **Blank response**
   - Server not running
   - Wrong port (check if using 3000 vs 3001)
