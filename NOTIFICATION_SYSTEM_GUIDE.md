# Notification System - Complete Guide

## Overview
This document explains how notifications are sent from the customer app to both the Admin Dashboard and Driver App.

---

## 🏢 Admin Dashboard Notifications

### Configuration

**Environment Variables:**
```env
ADMIN_DASHBOARD_URL=https://dfce8961-587a-418c-badd-91e67a04838d-00-1wfu1zybfjof6.kirk.replit.dev
ADMIN_API_KEY=zapygo-admin-2025-secure-key
```

**Service File:** `server/adminService.ts`

### Endpoints

#### 1. Health Check
```
GET /api/health
Headers:
  X-API-Key: zapygo-admin-2025-secure-key
  Content-Type: application/json
```

#### 2. Customer Registration Notification
```
POST /api/external/customer-registration
Headers:
  X-API-Key: zapygo-admin-2025-secure-key
  Content-Type: application/json

Payload:
{
  "id": "user-uuid",
  "name": "Customer Name",
  "username": "username",
  "email": "email@example.com",
  "phone": "+919876543210",
  "business_name": "Business Name",
  "business_address": "Business Address",
  "industry_type": "Industry Type",
  "gst_number": "GST123456789012",
  "pan_number": "ABCDE1234F",
  "role": "customer",
  "kyc_status": "pending",
  "kyc_documents": null,
  "is_active": true,
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z",
  "password_hash": "hashed_password"
}
```

**Triggered When:** User signs up (Line ~115 in `server/routes.ts`)

#### 3. KYC Submission Notification
```
POST /api/external/kyc-submission
Headers:
  X-API-Key: zapygo-admin-2025-secure-key
  Content-Type: application/json

Payload:
{
  "type": "kyc_submission",
  "customer_id": "user-uuid",
  "customer_name": "Customer Name",
  "customer_email": "email@example.com",
  "customer_phone": "+919876543210",
  "business_name": "Business Name",
  "kyc_status": "submitted",
  "kyc_documents": { /* document URLs */ },
  "submitted_at": "2025-01-15T10:30:00.000Z"
}
```

**Triggered When:** User uploads KYC documents (Line ~280 in `server/routes.ts`)

---

## 🚚 Driver App Notifications

### Configuration

**Environment Variables:**
```env
DRIVER_APP_URL=http://localhost:3000
CUSTOMER_APP_KEY=zapygo_customer_secret_2024
```

**Service File:** `server/driverService.ts`

### Endpoints

#### 1. Connection Test
```
GET /api/test
Headers:
  x-api-secret: zapygo_customer_secret_2024
  Content-Type: application/json
```

#### 2. New Order Notification
```
POST /api/notifications
Headers:
  x-api-secret: zapygo_customer_secret_2024
  Content-Type: application/json

Payload:
{
  "message": "New delivery request from Customer Name",
  "orderId": "order-uuid",
  "orderNumber": "ORD-20250115-001",
  "action": "new_order",
  "customer": {
    "name": "Customer Name",
    "phone": "+919876543210",
    "email": "email@example.com"
  },
  "orderDetails": {
    "quantity": 100,
    "fuelType": "Diesel",
    "deliveryAddress": "123 Main St, City",
    "deliveryCoordinates": {
      "latitude": 12.9716,
      "longitude": 77.5946
    }
  },
  "delivery": {
    "scheduledDate": "2025-01-20",
    "scheduledTime": "09:00",
    "deliveryInstructions": "Contact Customer Name at +919876543210 upon arrival"
  },
  "payment": {
    "totalAmount": "7500.00",
    "paymentMethod": "Prepaid",
    "ratePerLiter": "70.50",
    "deliveryCharges": "300.00",
    "gst": "54.00"
  }
}
```

**Triggered When:** Customer creates a new order (in `server/routes.ts`)

#### 3. OTP Generation Notification
```
POST /api/notifications
Headers:
  x-api-secret: zapygo_customer_secret_2024
  Content-Type: application/json

Payload:
{
  "orderId": "ORD-20250115-001",
  "deliveryOtp": "123456",
  "action": "otp_generated"
}
```

**Triggered When:** Customer generates delivery OTP (in `server/routes.ts`)

---

## 🔑 Key Differences

| Aspect | Admin Dashboard | Driver App |
|--------|----------------|------------|
| **Auth Header Name** | `X-API-Key` | `x-api-secret` |
| **Auth Value** | `zapygo-admin-2025-secure-key` | `zapygo_customer_secret_2024` |
| **Base URL** | Admin dashboard URL | Driver app URL |
| **Notification Types** | Customer registration, KYC | New orders, OTP |
| **Payload Structure** | User-centric | Order-centric |

---

## 📋 Implementation Checklist

### For Admin Dashboard Integration:
- [x] `adminService.ts` created
- [x] Admin URL configured (hardcoded)
- [x] API key configured (hardcoded)
- [x] Customer registration notification implemented
- [x] KYC submission notification implemented
- [ ] Add environment variables to .env
- [ ] Update adminService to use env vars instead of hardcoded values

### For Driver App Integration:
- [x] `driverService.ts` created
- [x] Driver URL configured via env var
- [x] API secret configured via env var
- [x] New order notification implemented
- [x] OTP notification implemented
- [x] Comprehensive logging added

---

## 🔧 How to Add New Notification Types

### For Admin Dashboard:

1. **Add method to `adminService.ts`:**
```typescript
async notifyNewEvent(data: EventData): Promise<boolean> {
  try {
    if (!this.adminDashboardUrl || !this.apiKey) {
      console.log("Admin dashboard not configured");
      return false;
    }

    const response = await fetch(
      `${this.adminDashboardUrl}/api/external/new-event`,
      {
        method: "POST",
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Admin notification error:", error);
    return false;
  }
}
```

2. **Call from routes:**
```typescript
await adminService.notifyNewEvent(eventData);
```

### For Driver App:

1. **Add method to `driverService.ts`:**
```typescript
async notifyNewEvent(data: EventData): Promise<boolean> {
  try {
    if (!this.driverAppUrl || !this.apiSecret) {
      console.log("Driver app not configured");
      return false;
    }

    const response = await fetch(
      `${this.driverAppUrl}/api/notifications`,
      {
        method: "POST",
        headers: {
          "x-api-secret": this.apiSecret,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "new_event",
          ...data
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Driver notification error:", error);
    return false;
  }
}
```

2. **Call from routes:**
```typescript
await driverService.notifyNewEvent(eventData);
```

---

## 🐛 Debugging

### Check Configuration:
```typescript
// Admin Dashboard
const adminInfo = await adminService.getIntegrationInfo();
console.log(adminInfo);

// Driver App
const driverInfo = await driverService.getIntegrationInfo();
console.log(driverInfo);
```

### Test Connection:
```typescript
// Admin Dashboard
const adminConnected = await adminService.testConnection();
console.log("Admin connected:", adminConnected);

// Driver App
const driverConnected = await driverService.testConnection();
console.log("Driver connected:", driverConnected);
```

### Common Issues:

1. **401 Unauthorized**: Check API key/secret
2. **404 Not Found**: Check URL and endpoint path
3. **Network Error**: Check if target service is running
4. **400 Bad Request**: Check payload structure

---

## 📝 Notes

- Admin notifications use **hardcoded** URL and API key (should be moved to env vars)
- Driver notifications use **environment variables** (best practice)
- Both services have comprehensive logging for debugging
- Notifications are **non-blocking** - app continues even if notification fails
- All notifications return boolean success status
