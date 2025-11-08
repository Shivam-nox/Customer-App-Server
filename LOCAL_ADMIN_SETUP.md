# Running Admin Dashboard Locally - Setup Guide

## Overview

You can run both the **customer app** and **admin dashboard** locally and they will communicate with each other!

## Current Setup

Your `.env` is now configured for local development:
```env
ADMIN_DASHBOARD_URL=http://localhost:3002
```

## Step-by-Step Setup

### 1. Run Customer App (Current App)
```bash
# In this directory (customer-app)
npm run dev
```
- Runs on: `http://localhost:5000` (or your configured port)

### 2. Run Admin Dashboard Locally
```bash
# In your admin dashboard directory
cd /path/to/admin-dashboard
npm run dev
```
- Should run on: `http://localhost:3002` (or whatever port it uses)
- **Important**: Make sure the port matches the `ADMIN_DASHBOARD_URL` in your `.env`

### 3. Test the Connection

**Create an order in customer app:**
1. Login to customer app
2. Create a new order
3. Check the customer app server logs - you should see:
   ```
   📦 =======================================
   🔔 NOTIFYING ADMIN ABOUT NEW ORDER
   📦 =======================================
   ✅ SUCCESS: Admin notified about new order
   ```

**Check admin dashboard:**
1. Open admin dashboard at `http://localhost:3002`
2. You should see the notification!

## Port Configuration

### If Your Admin Dashboard Uses a Different Port

Check what port your admin dashboard runs on, then update `.env`:

```env
# If admin runs on port 3001
ADMIN_DASHBOARD_URL=http://localhost:3001

# If admin runs on port 4000
ADMIN_DASHBOARD_URL=http://localhost:4000

# If admin runs on port 5001
ADMIN_DASHBOARD_URL=http://localhost:5001
```

Then restart your customer app.

## Admin Dashboard Requirements

Your admin dashboard needs these endpoints to receive notifications:

### Required Endpoints:
1. `POST /api/external/customer-registration` - New customer signups
2. `POST /api/external/new-order` - New orders
3. `POST /api/external/high-value-order` - High-value orders (>₹50,000)
4. `POST /api/external/payment-completed` - Payment completions
5. `POST /api/external/order-status-change` - Order status updates
6. `POST /api/external/order-cancelled` - Order cancellations
7. `POST /api/external/kyc-submission` - KYC document submissions

### Authentication:
All endpoints must validate the `X-API-Key` header:
```
X-API-Key: zapygo-admin-2025-secure-key
```

## Troubleshooting

### Issue: "Connection refused" or "ECONNREFUSED"
**Solution**: Make sure admin dashboard is running on the correct port

### Issue: "404 Not Found"
**Solution**: Admin dashboard doesn't have the required endpoints implemented

### Issue: "401 Unauthorized"
**Solution**: API key mismatch - check both apps use the same key

### Issue: Still getting 503 errors
**Solution**: You're still pointing to Replit URL. Check your `.env` file.

## Switching Between Local and Production

### For Local Development:
```env
ADMIN_DASHBOARD_URL=http://localhost:3002
```

### For Production (Replit):
```env
ADMIN_DASHBOARD_URL=https://dfce8961-587a-418c-badd-91e67a04838d-00-1wfu1zybfjof6.kirk.replit.dev
```

### For Production (Other Hosting):
```env
ADMIN_DASHBOARD_URL=https://your-admin-dashboard.com
```

## Testing Checklist

- [ ] Admin dashboard is running locally
- [ ] Customer app is running locally
- [ ] `.env` has correct `ADMIN_DASHBOARD_URL`
- [ ] Customer app restarted after `.env` change
- [ ] Create a test order
- [ ] Check customer app logs for "SUCCESS"
- [ ] Check admin dashboard for notification
- [ ] Verify notification appears in admin UI

## Example Notification Flow

```
Customer App (localhost:5000)
    ↓
    Creates Order
    ↓
    Sends POST request to Admin Dashboard
    ↓
Admin Dashboard (localhost:3002)
    ↓
    Receives notification at /api/external/new-order
    ↓
    Stores in database / Shows in UI
    ↓
    Admin sees notification! ✅
```

## Benefits of Local Development

✅ No Replit sleep issues
✅ Instant notifications
✅ Easy debugging
✅ See both apps' logs
✅ Faster development
✅ No internet dependency

---

**Ready to test?**
1. Start admin dashboard: `npm run dev` (in admin directory)
2. Start customer app: `npm run dev` (in this directory)
3. Create an order
4. Watch the magic happen! 🎉

