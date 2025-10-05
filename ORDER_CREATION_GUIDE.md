# 📋 Complete Order Creation System Guide

## 🗄️ Database Schema

### **Orders Table (`orders`)**

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | `varchar` | PRIMARY KEY, UUID | Unique order identifier |
| `orderNumber` | `varchar(20)` | UNIQUE, NOT NULL | Human-readable order number (auto-generated) |
| `customerId` | `varchar` | NOT NULL | References user who placed the order |
| `quantity` | `integer` | NOT NULL | Fuel quantity in liters |
| `ratePerLiter` | `decimal(10,2)` | NOT NULL | Price per liter at time of order |
| `subtotal` | `decimal(10,2)` | NOT NULL | quantity × ratePerLiter |
| `deliveryCharges` | `decimal(10,2)` | NOT NULL | Fixed delivery charges |
| `gst` | `decimal(10,2)` | NOT NULL | GST on delivery charges (18%) |
| `totalAmount` | `decimal(10,2)` | NOT NULL | subtotal + deliveryCharges + gst |
| `deliveryAddress` | `text` | NOT NULL | Full formatted delivery address |
| `deliveryAddressId` | `varchar` | FOREIGN KEY | References customer_addresses.id |
| `deliveryLatitude` | `decimal(10,7)` | OPTIONAL | GPS latitude for delivery location |
| `deliveryLongitude` | `decimal(10,7)` | OPTIONAL | GPS longitude for delivery location |
| `scheduledDate` | `timestamp` | NOT NULL | Delivery date |
| `scheduledTime` | `varchar(5)` | NOT NULL | Delivery time slot (HH:MM format) |
| `status` | `order_status` | DEFAULT 'pending' | Order status enum |
| `driverId` | `varchar` | OPTIONAL | Assigned driver ID |
| `deliveryOtp` | `varchar(6)` | OPTIONAL | OTP for delivery verification |
| `notes` | `text` | OPTIONAL | Additional order notes |
| `createdAt` | `timestamp` | DEFAULT now() | Order creation timestamp |
| `updatedAt` | `timestamp` | DEFAULT now() | Last update timestamp |

### **Order Status Enum Values**
- `pending` - Order placed, awaiting driver assignment
- `confirmed` - Driver assigned and accepted
- `in_transit` - Driver is on the way
- `delivered` - Order completed successfully
- `cancelled` - Order cancelled

### **Available Time Slots**
- `09:00` - 9:00 AM
- `11:00` - 11:00 AM  
- `13:00` - 1:00 PM
- `15:00` - 3:00 PM
- `17:00` - 5:00 PM
- `19:00` - 7:00 PM

## 🔧 API Endpoint

### **POST /api/orders**

**Headers:**
```
Content-Type: application/json
x-user-id: {customer_id}
```

**Request Body Schema:**
```typescript
{
  quantity: number;           // Required, minimum 1
  deliveryAddress: string;    // Required, minimum 1 character
  deliveryAddressId?: string; // Optional, references customer address
  deliveryLatitude?: number;  // Optional, GPS coordinate
  deliveryLongitude?: number; // Optional, GPS coordinate
  scheduledDate: string;      // Required, ISO date string
  scheduledTime: string;      // Required, must match time slot regex
}
```

**Validation Rules:**
```typescript
const createOrderSchema = z.object({
  quantity: z.number().min(1),
  deliveryAddress: z.string().min(1),
  deliveryLatitude: z.number().optional(),
  deliveryLongitude: z.number().optional(),
  scheduledDate: z.string(),
  scheduledTime: z.string().regex(
    /^(09|11|13|15|17|19):00$/,
    "Invalid time slot. Must be one of: 09:00, 11:00, 13:00, 15:00, 17:00, 19:00"
  ),
});
```

**Example Request:**
```json
{
  "quantity": 500,
  "deliveryAddress": "123 Main Street, Koramangala, Bangalore, Karnataka - 560034",
  "deliveryAddressId": "addr_123456",
  "deliveryLatitude": 12.9352,
  "deliveryLongitude": 77.6245,
  "scheduledDate": "2024-01-15",
  "scheduledTime": "15:00"
}
```

**Response:**
```json
{
  "order": {
    "id": "order_123456",
    "orderNumber": "ZAP240115001",
    "customerId": "customer_123",
    "quantity": 500,
    "ratePerLiter": "70.50",
    "subtotal": "35250.00",
    "deliveryCharges": "300.00",
    "gst": "54.00",
    "totalAmount": "35604.00",
    "deliveryAddress": "123 Main Street, Koramangala, Bangalore, Karnataka - 560034",
    "deliveryAddressId": "addr_123456",
    "deliveryLatitude": "12.9352000",
    "deliveryLongitude": "77.6245000",
    "scheduledDate": "2024-01-15T00:00:00.000Z",
    "scheduledTime": "15:00",
    "status": "pending",
    "driverId": null,
    "deliveryOtp": null,
    "notes": null,
    "createdAt": "2024-01-10T10:30:00.000Z",
    "updatedAt": "2024-01-10T10:30:00.000Z"
  },
  "driverNotified": true
}
```

## 💰 Pricing Calculation

**Dynamic Pricing from System Settings:**
```typescript
// Fetched from system_settings table
const ratePerLiter = 70.50;      // rate_per_liter
const deliveryCharges = 300.00;  // delivery_charges  
const gstRate = 0.18;            // gst_rate (18%)

// Calculations
const subtotal = quantity × ratePerLiter;
const gst = deliveryCharges × gstRate;
const totalAmount = subtotal + deliveryCharges + gst;
```

**Example Calculation (500L):**
- Subtotal: 500 × ₹70.50 = ₹35,250
- Delivery: ₹300
- GST (18%): ₹300 × 0.18 = ₹54
- **Total: ₹35,604**

## 🔄 Order Flow

1. **Order Creation** (`pending`)
   - Customer places order
   - Pricing calculated dynamically
   - Notification sent to customer
   - Driver app notified

2. **Driver Assignment** (`confirmed`)
   - Driver accepts order
   - Status updated to confirmed
   - Customer notified

3. **In Transit** (`in_transit`)
   - Driver starts delivery
   - OTP generated for verification
   - Real-time tracking available

4. **Delivery** (`delivered`)
   - OTP verified at delivery
   - Order marked as completed
   - Payment processed (if COD)

## 🏗️ For Admin App Implementation

### **Required Fields for Admin Order Creation:**

```typescript
interface AdminOrderCreate {
  // Customer Selection
  customerId: string;           // Dropdown of customers
  
  // Order Details
  quantity: number;             // Number input, min 1
  deliveryAddress: string;      // Text area
  deliveryAddressId?: string;   // Optional, if using saved address
  
  // Location (Optional)
  deliveryLatitude?: number;    // GPS coordinate
  deliveryLongitude?: number;   // GPS coordinate
  
  // Scheduling
  scheduledDate: string;        // Date picker
  scheduledTime: string;        // Dropdown with time slots
  
  // Admin Only Fields
  notes?: string;               // Optional notes
  driverId?: string;            // Optional driver assignment
  status?: 'pending' | 'confirmed'; // Default pending
}
```

### **Admin Form Validation:**
```typescript
const adminOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  deliveryAddress: z.string().min(10, "Address must be at least 10 characters"),
  deliveryAddressId: z.string().optional(),
  deliveryLatitude: z.number().optional(),
  deliveryLongitude: z.number().optional(),
  scheduledDate: z.string().refine(
    (date) => new Date(date) > new Date(),
    "Scheduled date must be in the future"
  ),
  scheduledTime: z.enum(["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"]),
  notes: z.string().optional(),
  driverId: z.string().optional(),
  status: z.enum(["pending", "confirmed"]).default("pending"),
});
```

### **Admin API Endpoint:**
```typescript
// POST /api/admin/orders
app.post("/api/admin/orders", requireAdminAuth, async (req, res) => {
  const orderData = adminOrderSchema.parse(req.body);
  
  // Same pricing calculation as customer orders
  // Create order with admin-specific fields
  // Send notifications to customer and driver
});
```

## 📱 Frontend Implementation

### **Customer App Form:**
```typescript
const orderForm = useForm({
  quantity: number,
  deliveryAddress: string,
  scheduledDate: string,
  scheduledTime: string,
});
```

### **Admin App Form:**
```typescript
const adminOrderForm = useForm({
  customerId: string,        // Customer dropdown
  quantity: number,
  deliveryAddress: string,
  scheduledDate: string,
  scheduledTime: string,
  notes: string,            // Optional
  driverId: string,         // Optional driver assignment
  status: string,           // Default "pending"
});
```

## 🔐 Authentication & Authorization

- **Customer Orders**: Require `x-user-id` header with customer ID
- **Admin Orders**: Require admin authentication token
- **Order Access**: Customers can only access their own orders
- **Admin Access**: Admins can access all orders

## 📊 Related Tables

- **customer_addresses**: For delivery address details
- **payments**: For payment processing
- **notifications**: For order updates
- **system_settings**: For dynamic pricing
- **users**: For customer and driver information
