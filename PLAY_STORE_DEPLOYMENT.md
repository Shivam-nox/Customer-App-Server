# Google Play Store Deployment Guide - Zapygo

## Overview
This guide will help Us deploy your Zapygo PWA to Google Play Store using Trusted Web Activity (TWA) with Bubblewrap.

## Prerequisites Checklist
- ✅ Google Play Console Account ($25 one-time fee)
- ✅ HTTPS Domain (your app is deployed with SSL)
- ✅ Node.js installed
- ✅ Java JDK installed (version 18.0.2.1 detected)

## Step 1: Install Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
```

## Step 2: Prepare Your App Information

Before initializing, have this information ready:

### Required Information:
1. **App Domain**: Your deployed app URL (e.g., https://zapygo.com)
2. **Package Name**: Reverse domain format (e.g., com.zapygo.app)
3. **App Name**: Zapygo - Doorstep Diesel Delivery
4. **Display Mode**: standalone (already set in manifest)
5. **Icon Paths**: 
   - 192x192: client/public/icon-192.png
   - 512x512: client/public/icon-512.png

### Recommended Package Name Format:
```
com.zapygo.app
```
or
```
com.yourdomain.zapygo
```

## Step 3: Initialize TWA Project

Create a new directory for your Android app:

```bash
# Create a directory for the Android build
mkdir zapygo-android
cd zapygo-android

# Initialize Bubblewrap (interactive setup)
bubblewrap init --manifest https://YOUR_DOMAIN.com/manifest.json
```

### During Interactive Setup:
- **Domain**: Enter your full HTTPS URL
- **Package Name**: Use format like `com.zapygo.app`
- **App Name**: Zapygo
- **Launcher Name**: Zapygo
- **Display Mode**: standalone
- **Orientation**: portrait
- **Theme Color**: #1976D2
- **Background Color**: #FFFFFF
- **Start URL**: /
- **Icon URL**: Will be fetched from manifest
- **Maskable Icon**: Yes (your manifest has maskable icons)
- **Shortcuts**: Yes (your manifest has shortcuts)
- **Signing Key**: Bubblewrap will generate one for you

## Step 4: Generate Signing Key

Bubblewrap will automatically create a signing key during the build process. You'll be asked:

1. **Key Password**: Create a strong password (SAVE THIS!)
2. **Store Password**: Create a strong password (SAVE THIS!)
3. **Key Alias**: Default is `android` (you can keep this)
4. **Your Name**: Your name or company name
5. **Organization**: Zapygo or your company name
6. **City**: Your city
7. **State**: Your state
8. **Country Code**: IN (for India)

**CRITICAL**: Save these passwords in a secure location! You'll need them for:
- Future app updates
- Play Store uploads
- Key recovery

## Step 5: Build the APK

```bash
# Build the signed APK
bubblewrap build
```

This will create:
- `app-release-signed.apk` - Ready for Play Store upload
- `app-release-bundle.aab` - Android App Bundle (preferred by Play Store)

**Note**: Google Play Store prefers `.aab` (Android App Bundle) over `.apk`

## Step 6: Verify Digital Asset Links

For TWA to work, you need to verify domain ownership. Bubblewrap generates an `assetlinks.json` file.

### Upload to Your Website:

1. Copy the generated `assetlinks.json` file
2. Upload it to: `https://YOUR_DOMAIN.com/.well-known/assetlinks.json`

The file should be accessible at:
```
https://YOUR_DOMAIN.com/.well-known/assetlinks.json
```

### Example assetlinks.json structure:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.zapygo.app",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

## Step 7: Test Your APK Locally (Optional)

If you have an Android device:

```bash
# Install ADB (Android Debug Bridge)
brew install android-platform-tools

# Connect your Android device via USB (enable USB debugging)
adb devices

# Install the APK
adb install app-release-signed.apk
```

## Step 8: Prepare for Play Store Upload

### Required Assets:

1. **App Icon**: 512x512 PNG (you have this: icon-512.png)
2. **Feature Graphic**: 1024x500 PNG (create this)
3. **Screenshots**: At least 2 screenshots
   - Phone: 16:9 or 9:16 ratio
   - Minimum: 320px
   - Maximum: 3840px
4. **Privacy Policy URL**: Required for apps that handle user data
5. **App Description**: Short (80 chars) and Full (4000 chars)

### App Store Listing Information:

**Short Description** (max 80 characters):
```
Professional doorstep diesel delivery service for businesses in India
```

**Full Description** (max 4000 characters):
```
Zapygo - Your Trusted Doorstep Diesel Delivery Partner

Get diesel delivered directly to your doorstep with Zapygo, India's premier on-demand fuel delivery service for businesses.

KEY FEATURES:
• Real-time order tracking with live GPS
• Secure online payments via Razorpay
• Multiple delivery address management
• Instant order confirmation
• Professional delivery partners
• Business KYC verification
• Order history and analytics
• 24/7 customer support

WHY CHOOSE ZAPYGO?
✓ Save time and resources
✓ No more fuel station visits
✓ Transparent pricing
✓ Reliable and timely delivery
✓ Secure and verified service
✓ Business-focused solutions

PERFECT FOR:
- Construction sites
- Manufacturing units
- Agricultural operations
- Generator maintenance
- Fleet management
- Industrial operations

Download Zapygo today and experience hassle-free diesel delivery!
```

**Category**: Business

**Tags**: diesel, fuel delivery, business, logistics, doorstep delivery

## Step 9: Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in app details:
   - App name: Zapygo
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
4. Complete the app content questionnaire
5. Set up your store listing (use info from Step 8)
6. Upload your `.aab` file (preferred) or `.apk`
7. Complete content rating questionnaire
8. Set up pricing & distribution (select India and other countries)
9. Submit for review

### Content Rating:
Your app will likely be rated "Everyone" or "Teen" depending on your questionnaire answers.

## Step 10: Post-Submission

### Review Process:
- Initial review: 1-7 days
- You'll receive email notifications about status
- Address any issues Google identifies

### After Approval:
- App goes live on Play Store
- Users can search and download
- Monitor reviews and ratings
- Respond to user feedback

## Updating Your App

When you update your website, the TWA automatically reflects changes. However, for app updates:

```bash
cd zapygo-android

# Update the version in twa-manifest.json
# Increment versionCode and versionName

# Rebuild
bubblewrap build

# Upload new .aab to Play Console
```

## Important Files to Keep Safe

1. **Keystore file**: `android.keystore` (or similar name)
2. **Passwords**: Key password and store password
3. **Package name**: com.zapygo.app
4. **SHA-256 fingerprint**: For Digital Asset Links

**Store these in a secure password manager!**

## Troubleshooting

### Issue: "Digital Asset Links verification failed"
**Solution**: Ensure `assetlinks.json` is accessible at `https://YOUR_DOMAIN/.well-known/assetlinks.json`

### Issue: "App not opening, redirects to browser"
**Solution**: Check that your domain matches exactly in both the app and assetlinks.json

### Issue: "Build failed"
**Solution**: Ensure Java JDK is properly installed and JAVA_HOME is set

### Issue: "Icon not displaying correctly"
**Solution**: Verify icon files are 192x192 and 512x512 PNG format

## Next Steps After This Guide

1. ✅ Install Bubblewrap CLI
2. ✅ Gather your domain and app information
3. ✅ Initialize TWA project
4. ✅ Build signed APK/AAB
5. ✅ Upload assetlinks.json to your website
6. ✅ Create Play Store assets (screenshots, feature graphic)
7. ✅ Upload to Play Console
8. ✅ Submit for review

## Estimated Timeline

- Setup and build: 30-60 minutes
- Creating store assets: 1-2 hours
- Play Console setup: 1-2 hours
- Google review: 1-7 days

**Total time to live app**: 1-2 weeks

## Support Resources

- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [TWA Documentation](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)

---

**Ready to start?** Let me know your domain URL and I can help you with the specific commands!
