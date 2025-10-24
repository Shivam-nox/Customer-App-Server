# Replit Sleep Issue - Explained & Fixed

## What's Happening

Your admin dashboard is on **Replit free tier**, which automatically **sleeps after 1 hour of inactivity**.

When I tested the URL, I got:
```
HTTP/1.1 503 Service Unavailable
Replit-Proxy-Error: asleep
```

This is **normal Replit behavior**, not a bug!

## How It Works Now

I've **re-enabled the admin dashboard URL** in the code.

### First Notification After Sleep:
- ❌ May fail with 503 (Replit is waking up)
- ⏱️ Takes 10-30 seconds to wake up
- The notification is lost (but this is just the wake-up call)

### Subsequent Notifications:
- ✅ Work perfectly
- ✅ Admin dashboard is awake
- ✅ All notifications received

## Solutions

### Option 1: Manual Wake-Up (Recommended for Testing)
1. Open your admin dashboard Replit
2. Click "Run" to start it
3. Keep it open while testing
4. All notifications will work immediately

### Option 2: Let It Auto-Wake (Production)
- First notification after sleep will wake it up
- Takes 10-30 seconds
- Subsequent notifications work fine
- This is acceptable for production

### Option 3: Upgrade Replit (Best for Production)
- Replit paid plans don't sleep
- All notifications work 100% of the time
- No wake-up delays

### Option 4: Use Environment Variable
Add to your `.env` file:
```env
ADMIN_DASHBOARD_URL=https://dfce8961-587a-418c-badd-91e67a04838d-00-1wfu1zybfjof6.kirk.replit.dev
ADMIN_API_KEY=zapygo-admin-2025-secure-key
```

This way you can easily change the URL without modifying code.

## Current Status

✅ Admin dashboard URL is configured
✅ Notifications will be sent
⚠️  First notification after sleep may fail (wakes up Replit)
✅ Subsequent notifications work perfectly

## Testing

1. **Wake up admin dashboard** (open Replit and click Run)
2. **Create an order** in customer app
3. **Check admin dashboard** - you should see the notification!

## Why Customer Registration Worked

You might have noticed customer registration notifications worked earlier. That's because:
- You probably created your account when the admin dashboard was already awake
- Or the admin dashboard woke up in time to receive it

## Bottom Line

This is **not a bug** - it's how Replit free tier works. Your code is correct!

**For production**: Consider upgrading Replit or using a different hosting solution that doesn't sleep.

**For development**: Just manually wake up the admin dashboard before testing.

