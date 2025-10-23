# Zapygo Play Store - Quick Start Commands

## Your App Details
- **URL**: https://zapygo-customer-app.replit.app
- **Manifest**: ✅ Accessible
- **Package Name**: `app.replit.zapygo` (recommended)
- **App Name**: Zapygo

---

## Step 1: Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

---

## Step 2: Create Android Build Directory

```bash
# Create directory for Android build (outside your main project)
cd ~
mkdir zapygo-android
cd zapygo-android
```

---

## Step 3: Initialize TWA Project

```bash
bubblewrap init --manifest https://zapygo-customer-app.replit.app/manifest.json
```

### During the interactive setup, use these values:

**Question** → **Your Answer**

1. **Domain**: `zapygo-customer-app.replit.app`
2. **Package Name**: `app.replit.zapygo` (or `com.zapygo.app`)
3. **Application Name**: `Zapygo`
4. **Launcher Name**: `Zapygo`
5. **Display Mode**: `standalone` (press Enter, it's default)
6. **Orientation**: `portrait` (press Enter, it's default)
7. **Theme Color**: `#1976D2` (press Enter, it's default)
8. **Background Color**: `#FFFFFF` (press Enter, it's default)
9. **Start URL**: `/` (press Enter, it's default)
10. **Icon URL**: Press Enter (will use manifest icons)
11. **Maskable Icon**: `yes` (press Enter)
12. **Monochrome Icon**: `no` (press Enter)
13. **Include app shortcuts**: `yes` (press Enter)
14. **Signing Key**: Press Enter (Bubblewrap will generate)

### For Signing Key Generation:

15. **Key Password**: Create a strong password (SAVE THIS!)
16. **Store Password**: Create a strong password (SAVE THIS!)
17. **First and Last Name**: Your name
18. **Organizational Unit**: `Zapygo`
19. **Organization**: `Zapygo`
20. **City**: Your city
21. **State**: Your state
22. **Country Code**: `IN`

**CRITICAL**: Write down both passwords immediately!

---

## Step 4: Build the App

```bash
bubblewrap build
```

This creates:
- `app-release-bundle.aab` ← Upload this to Play Store (preferred)
- `app-release-signed.apk` ← For testing

---

## Step 5: Get SHA-256 Fingerprint

```bash
bubblewrap fingerprint
```

Copy the SHA-256 fingerprint - you'll need it for the next step.

---

## Step 6: Create Digital Asset Links File

Bubblewrap creates an `assetlinks.json` file. You need to upload this to your Replit app.

### Location on your computer:
```
~/zapygo-android/assetlinks.json
```

### Where to upload on Replit:
You need to serve this file at:
```
https://zapygo-customer-app.replit.app/.well-known/assetlinks.json
```

**I'll help you set this up in your Replit project next!**

---

## Step 7: Test the APK (Optional)

If you have an Android device:

```bash
# Install ADB
brew install android-platform-tools

# Connect device via USB (enable USB debugging on phone)
adb devices

# Install APK
cd ~/zapygo-android
adb install app-release-signed.apk
```

---

## Step 8: Prepare Play Store Assets

### Required Files:

1. **App Icon**: ✅ You have this (icon-512.png)

2. **Feature Graphic**: Create 1024x500 PNG
   - Use Canva, Figma, or Photoshop
   - Include app name and tagline
   - Use your brand colors (#1976D2)

3. **Screenshots**: Take 2-8 screenshots
   - Open your app in browser
   - Use browser dev tools (F12) → Device toolbar
   - Set to Pixel 5 or similar (1080x2340)
   - Take screenshots of:
     - Home/Login screen
     - New Order screen
     - Order Tracking screen
     - Profile screen

4. **Privacy Policy**: Required!
   - You have one at: https://zapygo-customer-app.replit.app/privacy-policy
   - Use this URL in Play Console

---

## Step 9: Upload to Play Console

1. Go to: https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - App name: **Zapygo**
   - Default language: **English (United States)**
   - App or game: **App**
   - Free or paid: **Free**
4. Accept declarations
5. Click **"Create app"**

### Complete Setup:

**Dashboard → App content:**
- Privacy policy: `https://zapygo-customer-app.replit.app/privacy-policy`
- App access: All functionality available without restrictions
- Ads: No (unless you have ads)
- Content rating: Complete questionnaire
- Target audience: 18+ (business app)
- News app: No
- COVID-19 contact tracing: No
- Data safety: Complete form (what data you collect)

**Dashboard → Store listing:**
- App name: Zapygo
- Short description: Professional doorstep diesel delivery service for businesses in India
- Full description: (Use the one from PLAY_STORE_DEPLOYMENT.md)
- App icon: Upload icon-512.png
- Feature graphic: Upload your 1024x500 image
- Screenshots: Upload 2-8 screenshots
- App category: Business
- Store listing contact: Your email
- Privacy policy: https://zapygo-customer-app.replit.app/privacy-policy

**Dashboard → Production → Create new release:**
- Upload: `app-release-bundle.aab`
- Release name: 1.0
- Release notes: "Initial release of Zapygo - Doorstep Diesel Delivery"
- Click **"Save"** → **"Review release"** → **"Start rollout to Production"**

---

## Important Files to Save

After building, save these files securely:

1. **Keystore**: `~/zapygo-android/android.keystore`
2. **Passwords**: Both key and store passwords
3. **Package name**: `app.replit.zapygo`
4. **SHA-256 fingerprint**: From step 5

**Back these up to a secure location (password manager, encrypted drive)!**

---

## Timeline

- ✅ Steps 1-6: 30 minutes (we'll do this now)
- ⏳ Step 7: Optional testing
- ⏳ Step 8: 1-2 hours (create assets)
- ⏳ Step 9: 1 hour (Play Console setup)
- ⏳ Google Review: 1-7 days

---

## Next: Let's Start!

Run the commands above, and let me know when you:
1. Complete Step 3 (init) - I'll help with assetlinks.json
2. Complete Step 4 (build) - I'll help prepare for Play Store
3. Need help with screenshots or feature graphic

**Ready? Start with Step 1!** 🚀
