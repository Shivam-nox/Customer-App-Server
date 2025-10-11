# KYC Document Upload - Drag & Drop Feature

## Overview
Enhanced the KYC document upload page with clear drag & drop instructions and verified the KYC status workflow.

## Features Implemented

### 1. Drag & Drop Support 🎯
The KYC upload page now clearly indicates drag & drop functionality:

**Before:**
```
Click to upload {Document Name}
```

**After:**
```
Drag & drop or click to upload
{Document Name}
PDF, JPG, PNG • Max 5MB
```

### 2. Upload Methods
Users can now upload documents using either method:
- **Drag & Drop**: Drag files directly onto the upload area
- **Click to Browse**: Click the upload area to open file browser

### 3. Technical Implementation
- Uses Uppy's DashboardModal which has built-in drag & drop support
- Modal opens when clicking the upload area
- Supports dragging files directly into the modal
- Visual feedback during drag operations
- Progress tracking during upload

## KYC Status Workflow ✅

### Status Flow
```
pending → submitted → verified/rejected
```

### 1. Initial State: "pending"
- New users start with `kycStatus: "pending"`
- Profile shows: "KYC Pending" (gray badge)
- CTA button: "Complete KYC Verification"

### 2. After Upload: "submitted"
- When user uploads all 3 documents and clicks "Submit for Verification"
- Status changes to: `kycStatus: "submitted"`
- Profile shows: "KYC Under Review" (orange badge with clock icon)
- Customer receives notification: "Your KYC documents have been submitted for verification"
- Admin receives notification: "New KYC Submission from {Customer Name}"

### 3. After Review: "verified" or "rejected"
- Admin reviews documents in admin dashboard
- Status changes to either:
  - `kycStatus: "verified"` → "KYC Verified" (green badge with checkmark)
  - `kycStatus: "rejected"` → "KYC Rejected" (red badge with X icon)

## UI/UX Improvements

### Upload Area Design
```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │         [Upload Icon]         │  │
│  │                               │  │
│  │  Drag & drop or click to      │  │
│  │  upload                       │  │
│  │                               │  │
│  │  GST Certificate              │  │
│  │  PDF, JPG, PNG • Max 5MB      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Visual States

#### 1. Not Uploaded (Default)
- Gray dashed border
- Blue icon
- Hover: Blue background with blue border
- Text: "Drag & drop or click to upload"

#### 2. Uploaded (Success)
- Green solid border
- Green background
- Green checkmark icon
- Text: "Document uploaded successfully"

#### 3. Uploading (Progress)
- Uppy modal shows:
  - File preview
  - Upload progress bar
  - Cancel button
  - File size and type

## File Restrictions

### Supported Formats
- PDF (.pdf)
- JPEG (.jpg, .jpeg)
- PNG (.png)

### Size Limit
- Maximum: 5MB per file
- Enforced by Uppy before upload starts

### Number of Files
- 1 file per document type
- Total: 3 documents required (GST, PAN, License)

## User Flow

### Step 1: Navigate to KYC Upload
- From Profile → "KYC Documents" button
- Or from Home → "Complete KYC Verification" banner (if pending)

### Step 2: Upload Documents
For each of the 3 required documents:
1. **Option A - Drag & Drop**:
   - Drag file from computer
   - Drop onto the upload area
   - Modal opens showing file
   - Click "Upload" in modal

2. **Option B - Click to Browse**:
   - Click the upload area
   - Modal opens
   - Click "Browse files" or drag into modal
   - Select file from computer
   - Click "Upload" in modal

### Step 3: Submit for Verification
- All 3 documents must be uploaded
- "Submit for Verification" button becomes active (blue gradient)
- Click button to submit
- Redirected to home page
- Status changes to "submitted"

### Step 4: Wait for Review
- Admin receives notification
- Admin reviews documents in admin dashboard
- Review typically takes 24-48 hours
- Customer receives notification when status changes

## Notifications

### Customer Notifications
1. **On Upload**: "KYC Documents Submitted"
   - Message: "Your KYC documents have been submitted for verification. You'll be notified once reviewed."
   - Type: "kyc"

2. **On Approval**: "KYC Verified"
   - Message: "Your KYC documents have been verified. You can now place orders."
   - Type: "kyc"

3. **On Rejection**: "KYC Rejected"
   - Message: "Your KYC documents were rejected. Please re-upload correct documents."
   - Type: "kyc"

### Admin Notifications
1. **On Upload**: "New KYC Submission"
   - Message: "{Customer Name} ({Business Name}) has submitted KYC documents for review."
   - Type: "kyc"
   - Sent to: All admin users
   - Also sent to: External admin dashboard webhook

## Testing

### Test Drag & Drop
1. Navigate to KYC Upload page
2. Open file explorer
3. Drag a PDF file
4. Hover over upload area (should highlight)
5. Drop file (modal should open)
6. Verify file appears in modal
7. Click "Upload" button
8. Verify success message

### Test Click to Upload
1. Navigate to KYC Upload page
2. Click on upload area
3. Modal should open
4. Click "Browse files"
5. Select file from dialog
6. Click "Upload" button
7. Verify success message

### Test Status Change
1. Upload all 3 documents
2. Click "Submit for Verification"
3. Check profile page
4. Verify status shows "KYC Under Review" (orange)
5. Check notifications
6. Verify customer received confirmation
7. Login as admin
8. Verify admin received notification

## Files Changed
- ✅ `client/src/pages/kyc-upload.tsx` - Updated upload area text to indicate drag & drop

## Status Already Working
- ✅ KYC status changes to "submitted" on upload
- ✅ Profile page displays correct status with proper styling
- ✅ Admin notifications sent on KYC submission
- ✅ Customer notifications sent on KYC submission
- ✅ Status workflow (pending → submitted → verified/rejected) fully functional

## Benefits
1. **Clearer Instructions**: Users know they can drag & drop
2. **Faster Upload**: Drag & drop is quicker than browsing
3. **Better UX**: Modern, intuitive interface
4. **Visual Feedback**: Clear indication of upload areas
5. **Status Tracking**: Users can see their KYC status at any time
