# KYC Admin Notification System

## Overview
When a customer uploads KYC documents, the system now sends notifications to admin users through multiple channels.

## Notification Channels

### 1. External Admin Dashboard Webhook 🌐
- **Endpoint**: `POST /api/external/kyc-submission`
- **Authentication**: X-API-Key header
- **Payload**:
  ```json
  {
    "type": "kyc_submission",
    "customer_id": "uuid",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+91-9876543210",
    "business_name": "ABC Corp",
    "kyc_status": "submitted",
    "kyc_documents": { /* document URLs */ },
    "submitted_at": "2025-01-08T10:30:00Z"
  }
  ```

### 2. In-App Notifications 📱
- Creates notifications in the `notifications` table for all admin users
- Notification details:
  - **Title**: "New KYC Submission"
  - **Message**: "{Customer Name} ({Business Name}) has submitted KYC documents for review."
  - **Type**: "kyc"
  - **isRead**: false (initially)

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,           -- Admin user ID
  title TEXT NOT NULL,                -- "New KYC Submission"
  message TEXT NOT NULL,              -- Customer details
  type notification_type NOT NULL,    -- 'kyc'
  is_read BOOLEAN DEFAULT false,
  order_id VARCHAR,                   -- NULL for KYC notifications
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Customers Table (Role Field)
```sql
CREATE TABLE customers (
  ...
  role user_role DEFAULT 'customer',  -- 'customer' | 'admin' | 'driver'
  ...
);
```

## Implementation Details

### New AdminService Method
```typescript
async notifyKycSubmission(customer: User): Promise<boolean>
```
- Sends webhook to external admin dashboard
- Includes comprehensive customer and KYC information
- Returns success/failure status
- Logs detailed information for debugging

### New Storage Method
```typescript
async getAdminUsers(): Promise<Customer[]>
```
- Queries customers table where `role = 'admin'`
- Returns all admin users for notification distribution

### Updated KYC Upload Route
`PUT /api/kyc/documents`

**Flow**:
1. Update user's KYC documents and status to "submitted"
2. Create notification for the customer (confirmation)
3. Send webhook to external admin dashboard
4. Get all admin users from database
5. Create in-app notification for each admin user
6. Return success response with notification counts

**Response**:
```json
{
  "user": { /* updated user object */ },
  "adminNotified": true,              // External webhook success
  "adminUsersNotified": 2             // Number of admin users notified
}
```

## Logging

### Console Output
```
📄 =======================================
🔔 NOTIFYING ADMIN ABOUT KYC SUBMISSION
📄 =======================================
👤 Customer: John Doe
📧 Email: john@example.com
📞 Phone: +91-9876543210
🏢 Business: ABC Corp
📋 KYC Status: submitted
📎 Documents: Uploaded
🔗 Admin URL: https://admin.example.com/api/external/kyc-submission
✅ SUCCESS: Admin notified about KYC submission
📬 Created in-app notifications for 2 admin user(s)
📄 =======================================
```

## Testing

### 1. Test KYC Submission
```bash
# Upload KYC documents as a customer
curl -X PUT http://localhost:5000/api/kyc/documents \
  -H "x-user-id: customer-uuid" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": {
      "gst": "https://storage.example.com/gst.pdf",
      "pan": "https://storage.example.com/pan.pdf"
    }
  }'
```

### 2. Verify Admin Notifications
```bash
# Check notifications as admin user
curl http://localhost:5000/api/notifications \
  -H "x-user-id: admin-uuid"
```

### 3. Check Admin Dashboard Webhook
- Monitor admin dashboard logs for incoming webhook
- Verify payload structure matches expected format
- Check X-API-Key authentication

## Admin Dashboard Requirements

The external admin dashboard must implement:

### Endpoint
`POST /api/external/kyc-submission`

### Headers
- `X-API-Key`: Authentication key (configured in adminService)
- `Content-Type`: application/json

### Response
- **200 OK**: Notification received successfully
- **401 Unauthorized**: Invalid API key
- **400 Bad Request**: Invalid payload structure
- **500 Internal Server Error**: Server error

## Benefits

1. **Immediate Notification**: Admins are notified instantly when KYC is submitted
2. **Multiple Channels**: Both external dashboard and in-app notifications
3. **Audit Trail**: All notifications logged in database
4. **Scalable**: Automatically notifies all admin users
5. **Reliable**: Continues even if external webhook fails

## Error Handling

- If external webhook fails, in-app notifications still work
- Detailed error logging for debugging
- Non-blocking: Customer KYC submission succeeds even if notifications fail
- Graceful degradation: System continues to function

## Future Enhancements

1. Email notifications to admin users
2. SMS notifications for urgent KYC submissions
3. Push notifications via mobile app
4. Configurable notification preferences per admin
5. Notification aggregation (daily digest)
6. Priority levels for different notification types
