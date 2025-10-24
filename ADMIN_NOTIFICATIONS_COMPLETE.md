# Complete Admin Notification System

## Overview
This document details all notifications sent from the customer app to the Admin Dashboard, including both external webhook notifications and in-app notifications.

---

## 🔔 All Admin Notifications

### 1. Customer Registration ✅
**Trigger**: When a new user signs up

**External Webhook**:
- **Endpoint**: `POST /api/external/customer-registration`
- **Location**: `server/routes.ts` → `adminService.notifyCustomerRegistration()`

**In-App Notification**: ❌ None

**Payload**:
```json
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

---

### 2. KYC Document Submission ✅
**Trigger**: When customer uploads KYC documents

**External Webhook**:
- **Endpoint**: `POST /api/external/kyc-submission`
- **Location**: `server/routes.ts` → `adminService.notifyKycSubmission()`

**In-App Notification**: ✅ Yes
- **Title**: "New KYC Submission"
- **Message**: "{Customer Name} ({Business Name}) has submitted KYC documents for review."
- **Type**: "kyc"

**Payload**:
```json
{
  "type": "kyc_submission",
  "customer_id": "user-uuid",
  "customer_name": "Customer Name",
  "customer_email": "email@example.com",
  "customer_phone": "+919876543210",
  "business_name": "Business Name",
  "kyc_status": "submitted",
  "kyc_documents": { "gst": "url", "pan": "url" },
  "submitted_at": "2025-01-15T10:30:00.000Z"
}
```

---

### 3. New Order Creation ✅ NEW
**Trigger**: When customer creates a new order

**External Webhook**:
- **Endpoint**: `POST /api/external/new-order`
- **Location**: `server/routes.ts` → `adminService.notifyNewOrder()`

**In-App Notification**: ✅ Yes
- **Title**: "New Order Placed"
- **Message**: "{Customer Name} ({Business Name}) placed order #{Order Number} for {Quantity}L - ₹{Amount}"
- **Type**: "order_update"

**Payload**:
```json
{
  "type": "new_order",
  "order_id": "order-uuid",
  "order_number": "ORD-20250115-001",
  "customer_id": "user-uuid",
  "customer_name": "Customer Name",
  "customer_email": "email@example.com",
  "customer_phone": "+919876543210",
  "business_name": "Business Name",
  "quantity": 100,
  "total_amount": "7500.00",
  "delivery_address": "123 Main St, City",
  "scheduled_date": "2025-01-20T00:00:00.000Z",
  "scheduled_time": "09:00",
  "status": "pending",
  "created_at": "2025-01-15T10:30:00.000Z"
}
```

---

### 4. High-Value Order Alert ✅ NEW
**Trigger**: When order amount exceeds ₹50,000

**External Webhook**:
- **Endpoint**: `POST /api/external/high-value-order`
- **Location**: `server/routes.ts` → `adminService.notifyHighValueOrder()`

**In-App Notification**: ✅ Yes (via New Order notification)

**Payload**:
```json
{
  "type": "high_value_order",
  "order_id": "order-uuid",
  "order_number": "ORD-20250115-001",
  "customer_id": "user-uuid",
  "customer_name": "Customer Name",
  "customer_email": "email@example.com",
  "customer_phone": "+919876543210",
  "business_name": "Business Name",
  "total_amount": "75000.00",
  "quantity": 1000,
  "threshold": 50000,
  "created_at": "2025-01-15T10:30:00.000Z"
}
```

---

### 5. Payment Completion ✅ NEW
**Trigger**: When payment is successfully completed (Razorpay or COD)

**External Webhook**:
- **Endpoint**: `POST /api/external/payment-completed`
- **Location**: `server/routes.ts` → `adminService.notifyPaymentCompleted()`

**In-App Notification**: ✅ Yes
- **Title**: "Payment Received" (for online) or "COD Order Placed" (for COD)
- **Message**: "Payment of ₹{Amount} received for order #{Order Number} from {Customer Name}"
- **Type**: "payment"

**Payload**:
```json
{
  "type": "payment_completed",
  "payment_id": "payment-uuid",
  "order_id": "order-uuid",
  "order_number": "ORD-20250115-001",
  "customer_id": "user-uuid",
  "customer_name": "Customer Name",
  "customer_email": "email@example.com",
  "amount": "7500.00",
  "payment_method": "upi",
  "transaction_id": "TXN123456789",
  "status": "completed",
  "completed_at": "2025-01-15T10:30:00.000Z"
}
```

---

### 6. Payment Failure ✅ NEW
**Trigger**: When payment fails (future implementation)

**External Webhook**:
- **Endpoint**: `POST /api/external/payment-failed`
- **Location**: `adminService.notifyPaymentFailed()`

**In-App Notification**: ✅ Yes (when implemented)

**Payload**:
```json
{
  "type": "payment_failed",
  "payment_id": "payment-uuid",
  "order_id": "order-uuid",
  "order_number": "ORD-20250115-001",
  "customer_id": "user-uuid",
  "customer_name": "Customer Name",
  "customer_email": "email@example.com",
  "customer_phone": "+919876543210",
  "amount": "7500.00",
  "payment_method": "upi",
  "failure_reason": "Insufficient funds",
  "failed_at": "2025-01-15T10:30:00.000Z"
}
```

---

### 7. Order Cancellation ✅ NEW
**Trigger**: When customer cancels an order

**External Webhook**:
- **Endpoint**: `POST /api/external/order-cancelled`
- **Location**: `server/routes.ts` → `adminService.notifyOrderCancelled()`

**In-App Notification**: ✅ Yes
- **Title**: "Order Cancelled"
- **Message**: "Order #{Order Number} cancelled by {Customer Name}. Reason: {Reason}"
- **Type**: "order_update"

**API Endpoint**: `POST /api/orders/:id/cancel`

**Payload**:
```json
{
  "type": "order_cancelled",
  "order_id": "order-uuid",
  "order_number": "ORD-20250115-001",
  "customer_id": "user-uuid",
  "customer_name": "Customer Name",
  "customer_email": "email@example.com",
  "customer_phone": "+919876543210",
  "business_name": "Business Name",
  "total_amount": "7500.00",
  "cancellation_reason": "Changed delivery date",
  "cancelled_at": "2025-01-15T10:30:00.000Z"
}
```

---

### 8. Order Status Change ✅ NEW
**Trigger**: When order status changes (confirmed, in_transit, delivered)

**External Webhook**:
- **Endpoint**: `POST /api/external/order-status-change`
- **Location**: `server/routes.ts` → `adminService.notifyOrderStatusChange()`

**In-App Notification**: ✅ Yes
- **Title**: "Order Status Updated"
- **Message**: "Order #{Order Number} ({Customer Name}) is now {new status}"
- **Type**: "order_update"

**Payload**:
```json
{
  "type": "order_status_change",
  "order_id": "order-uuid",
  "order_number": "ORD-20250115-001",
  "customer_id": "user-uuid",
  "customer_name": "Customer Name",
  "old_status": "confirmed",
  "new_status": "in_transit",
  "driver_id": "driver-uuid",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

---

### 9. Driver Assignment ✅ NEW
**Trigger**: When admin assigns a driver to an order

**External Webhook**:
- **Endpoint**: `POST /api/external/order-status-change` (uses status change notification)
- **Location**: `server/routes.ts` → `adminService.notifyOrderStatusChange()`

**In-App Notification**: ✅ Yes
- **Title**: "Driver Assigned"
- **Message**: "Driver {Driver Name} assigned to order #{Order Number} ({Customer Name})"
- **Type**: "order_update"

---

### 10. System Error ✅ NEW
**Trigger**: When critical system errors occur (future implementation)

**External Webhook**:
- **Endpoint**: `POST /api/external/system-error`
- **Location**: `adminService.notifySystemError()`

**In-App Notification**: ✅ Yes (when implemented)

**Payload**:
```json
{
  "type": "system_error",
  "error_type": "payment_gateway_failure",
  "error_message": "Razorpay API timeout",
  "context": {
    "order_id": "order-uuid",
    "timestamp": "2025-01-15T10:30:00.000Z"
  },
  "occurred_at": "2025-01-15T10:30:00.000Z"
}
```

---

## 📊 Notification Summary Table

| Event | External Webhook | In-App Notification | Status |
|-------|-----------------|---------------------|--------|
| Customer Registration | ✅ | ❌ | Active |
| KYC Submission | ✅ | ✅ | Active |
| New Order | ✅ | ✅ | **NEW** |
| High-Value Order | ✅ | ✅ | **NEW** |
| Payment Completed | ✅ | ✅ | **NEW** |
| Payment Failed | ✅ | ✅ | Ready (not triggered yet) |
| Order Cancelled | ✅ | ✅ | **NEW** |
| Order Status Change | ✅ | ✅ | **NEW** |
| Driver Assignment | ✅ | ✅ | **NEW** |
| System Error | ✅ | ✅ | Ready (not triggered yet) |

---

## 🔧 Configuration

**Admin Dashboard Settings** (in `server/adminService.ts`):
```typescript
adminDashboardUrl: "https://dfce8961-587a-418c-badd-91e67a04838d-00-1wfu1zybfjof6.kirk.replit.dev"
apiKey: "zapygo-admin-2025-secure-key"
```

**Authentication**: All webhooks use `X-API-Key` header with the configured API key.

---

## 🎯 Admin Dashboard Requirements

The admin dashboard must implement these endpoints:

### Required Endpoints
1. `POST /api/external/customer-registration`
2. `POST /api/external/kyc-submission`
3. `POST /api/external/new-order` ⭐ NEW
4. `POST /api/external/high-value-order` ⭐ NEW
5. `POST /api/external/payment-completed` ⭐ NEW
6. `POST /api/external/payment-failed` ⭐ NEW
7. `POST /api/external/order-cancelled` ⭐ NEW
8. `POST /api/external/order-status-change` ⭐ NEW
9. `POST /api/external/system-error` ⭐ NEW

### Authentication
All endpoints must validate the `X-API-Key` header:
```
X-API-Key: zapygo-admin-2025-secure-key
```

### Response Codes
- **200 OK**: Notification received successfully
- **401 Unauthorized**: Invalid API key
- **400 Bad Request**: Invalid payload
- **500 Internal Server Error**: Server error

---

## 📱 In-App Notifications

All in-app notifications are stored in the `notifications` table and sent to users with `role = 'admin'`.

### Notification Schema
```typescript
{
  id: string;
  userId: string;           // Admin user ID
  title: string;            // Notification title
  message: string;          // Notification message
  type: "kyc" | "order_update" | "payment";
  isRead: boolean;          // false initially
  orderId?: string;         // Related order ID (if applicable)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🧪 Testing

### Test New Order Notification
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "x-user-id: customer-uuid" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 100,
    "deliveryAddress": "123 Main St",
    "scheduledDate": "2025-01-20",
    "scheduledTime": "09:00"
  }'
```

### Test Order Cancellation
```bash
curl -X POST http://localhost:5000/api/orders/order-uuid/cancel \
  -H "x-user-id: customer-uuid" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Changed delivery date"
  }'
```

### Test Payment Completion
```bash
curl -X POST http://localhost:5000/api/payments/razorpay/verify \
  -H "x-user-id: customer-uuid" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpayOrderId": "order_xxx",
    "razorpayPaymentId": "pay_xxx",
    "razorpaySignature": "signature_xxx",
    "orderId": "order-uuid"
  }'
```

---

## 📝 Implementation Notes

1. **Non-Blocking**: All admin notifications are non-blocking - the app continues even if notifications fail
2. **Dual Channel**: Most events send both external webhook AND in-app notifications
3. **Error Handling**: Comprehensive error logging for debugging
4. **Scalability**: Automatically notifies all admin users
5. **Audit Trail**: All notifications logged in database

---

## 🚀 Future Enhancements

1. Email notifications to admin users
2. SMS alerts for critical events
3. Push notifications via mobile app
4. Configurable notification preferences per admin
5. Notification aggregation (daily digest)
6. Priority levels for different notification types
7. Webhook retry mechanism for failed deliveries
8. Notification analytics and reporting

---

## 📞 Support

For issues or questions about the notification system:
- Check server logs for detailed error messages
- Verify admin dashboard URL and API key configuration
- Test connection using `adminService.testConnection()`
- Review payload structure in this document

