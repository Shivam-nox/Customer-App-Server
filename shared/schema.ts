import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  jsonb,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "driver",
  "admin",
]);
export const kycStatusEnum = pgEnum("kyc_status", [
  "pending",
  "submitted",
  "verified",
  "rejected",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "in_transit",
  "delivered",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "upi",
  "cards",
  "netbanking",
  "wallet",
  "cod",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "order_update",
  "payment",
  "kyc",
  "delivery",
  "general",
]);

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  username: varchar("username", { length: 50 }).unique(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash"),
  phone: varchar("phone", { length: 15 }).notNull(),
  businessName: text("business_name"),
  businessAddress: text("business_address"),
  industryType: text("industry_type"),
  gstNumber: varchar("gst_number", { length: 15 }),
  panNumber: varchar("pan_number", { length: 10 }),
  cinNumber: varchar("cin_number", { length: 21 }),
  role: userRoleEnum("role").default("customer").notNull(),
  kycStatus: kycStatusEnum("kyc_status").default("pending").notNull(),
  kycDocuments: jsonb("kyc_documents"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
});

// Customer Addresses table
export const customerAddresses = pgTable("customer_addresses", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  label: text("label").notNull(), // "Home", "Office", "Warehouse", etc.
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  landmark: text("landmark"),
  area: text("area").notNull(),
  city: text("city").notNull().default("Bangalore"),
  state: text("state").notNull().default("Karnataka"),
  pincode: varchar("pincode", { length: 6 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  pocName: text("poc_name"), // Point of Contact name for this address
  pocPhone: varchar("poc_phone", { length: 15 }), // Point of Contact phone for this address
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
});

// OTP verification table
export const otpVerifications = pgTable("otp_verifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  identifier: varchar("identifier", { length: 255 }).notNull(), // phone or email
  otp: varchar("otp", { length: 6 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // "phone" or "email"
  isVerified: boolean("is_verified").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number", { length: 20 }).unique().notNull(),
  customerId: varchar("customer_id").notNull(),
  quantity: integer("quantity").notNull(),
  ratePerLiter: decimal("rate_per_liter", {
    precision: 10,
    scale: 2,
  }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryCharges: decimal("delivery_charges", {
    precision: 10,
    scale: 2,
  }).notNull(),
  gst: decimal("gst", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryAddressId: varchar("delivery_address_id").references(
    () => customerAddresses.id,
  ),
  deliveryLatitude: decimal("delivery_latitude", { precision: 10, scale: 7 }),
  deliveryLongitude: decimal("delivery_longitude", { precision: 10, scale: 7 }),
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: varchar("scheduled_time", { length: 5 }).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  driverId: varchar("driver_id"),
  deliveryOtp: varchar("delivery_otp", { length: 6 }),
  notes: text("notes"),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  orderId: varchar("order_id")
    .notNull()
    .references(() => orders.id),
  customerId: varchar("customer_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  transactionId: varchar("transaction_id", { length: 100 }),
  gatewayResponse: jsonb("gateway_response"),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  orderId: varchar("order_id"),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
});

// System settings table for configurable constants
export const systemSettings = pgTable("system_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 50 }).notNull().unique(),
  value: text("value").notNull(),
  dataType: varchar("data_type", { length: 20 }).notNull().default("number"),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull().default("pricing"),
  isEditable: boolean("is_editable").default(true).notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
  updatedBy: varchar("updated_by"),
});

// Enhanced Drivers table with comprehensive KYC and authentication
export const drivers = pgTable("drivers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").unique(),
  address: text("address").notNull(),
  city: text("city").notNull().default("Empty"),
  state: text("state").notNull().default("Empty"),
  pincode: text("pincode").notNull().default("Empty"),
  kycStatus: text("kyc_status"), // pending, submitted, verified, rejected
  aadhaarNumber: text("aadhaar_number"),
  panNumber: text("pan_number"),
  drivingLicenseNumber: text("driving_license_number"),
  drivingLicenseExpiry: timestamp("driving_license_expiry"),
  bankAccountNumber: text("bank_account_number"),
  bankIfscCode: text("bank_ifsc_code"),
  bankAccountHolderName: text("bank_account_holder_name"),
  bankName: text("bank_name"),
  kycDocuments: jsonb("kyc_documents"), // {aadhaar: {url, status}, pan: {url, status}, license: {url, status}, bankPassbook: {url, status}}
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  remarks: text("remarks"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by"), // Admin/manager who reviewed
  currentVehicleId: varchar("current_vehicle_id"), // Currently assigned vehicle
  status: text("status"), // online, offline, on_delivery, on_break
  currentLocation: jsonb("current_location"), // {lat, lng, timestamp, address}
  isActive: boolean("is_active").notNull().default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  totalDeliveries: integer("total_deliveries").notNull().default(0),
  successfulDeliveries: integer("successful_deliveries").notNull().default(0),
  deliveriesThisMonth: integer("deliveries_this_month").notNull().default(0),
  lastCheckIn: timestamp("last_check_in"),
  joinedDate: timestamp("joined_date")
    .notNull()
    .default(sql`now()`),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

// Enhanced Vehicles table with detailed specifications and IoT integration
// export const vehicles = pgTable("vehicles", {
//   id: varchar("id")
//     .primaryKey()
//     .default(sql`gen_random_uuid()`),
//   registrationNumber: text("registration_number").notNull().unique(),
//   vehicleType: text("vehicle_type").notNull(), // tanker, mini_tanker, bowser
//   make: text("make").notNull(), // Tata, Mahindra, etc.
//   model: text("model").notNull(),
//   year: integer("year").notNull(),
//   capacity: integer("capacity").notNull(), // Maximum fuel capacity in liters
//   currentFuelLevel: integer("current_fuel_level").notNull().default(0),
//   chassisNumber: text("chassis_number"),
//   engineNumber: text("engine_number"),

//   // Legal compliance documents
//   registrationCertificate: text("registration_certificate_url"),
//   registrationExpiry: timestamp("registration_expiry"),
//   pesoLicense: text("peso_license_url"),
//   pesoExpiry: timestamp("peso_expiry"),
//   calibrationCertificate: text("calibration_certificate_url"),
//   calibrationExpiry: timestamp("calibration_expiry"),
//   insuranceNumber: text("insurance_number"),
//   insuranceExpiry: timestamp("insurance_expiry"),
//   pucCertificate: text("puc_certificate_url"),
//   pucExpiry: timestamp("puc_expiry"),
//   fireExtinguisherCertificate: text("fire_extinguisher_certificate_url"),
//   fireExtinguisherExpiry: timestamp("fire_extinguisher_expiry"),

//   // Maintenance tracking
//   lastMaintenanceDate: timestamp("last_maintenance_date"),
//   nextMaintenanceDate: timestamp("next_maintenance_date"),
//   maintenanceKms: integer("maintenance_kms"), // Kms at last maintenance
//   currentKms: integer("current_kms").notNull().default(0),
//   maintenanceLogs: jsonb("maintenance_logs"), // [{date, type, description, cost, vendor, kms}]

//   // IoT and tracking
//   iotDeviceId: text("iot_device_id"),
//   iotStatus: jsonb("iot_status"), // {gps: boolean, fuelSensor: boolean, lockSystem: boolean, dispenser: boolean, temperature: boolean}
//   gpsTrackerId: text("gps_tracker_id"),
//   currentLocation: jsonb("current_location"), // {lat, lng, timestamp, address, speed}

//   // Health and status
//   health: text("health"), // healthy, warning, critical, maintenance_due
//   healthChecks: jsonb("health_checks"), // {engine: "good", tyres: "warning", fuel_system: "good"}
//   lastHealthCheckDate: timestamp("last_health_check_date"),

//   // Operational status
//   isActive: boolean("is_active").notNull().default(true),
//   isOnRoute: boolean("is_on_route").notNull().default(false),
//   purchaseDate: timestamp("purchase_date"),
//   purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),

//   createdAt: timestamp("created_at")
//     .notNull()
//     .default(sql`now()`),
//   updatedAt: timestamp("updated_at")
//     .notNull()
//     .default(sql`now()`),
// });

// Driver-Vehicle assignment tracking
export const driverVehicleAssignments = pgTable("driver_vehicle_assignments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id")
    .notNull()
    .references(() => drivers.id),
  vehicleId: varchar("vehicle_id")
    .notNull()
    .references(() => vehiclesKycDocuments.id),
  assignedDate: timestamp("assigned_date")
    .notNull()
    .default(sql`now()`),
  unassignedDate: timestamp("unassigned_date"),
  isActive: boolean("is_active").notNull().default(true),
  assignedBy: varchar("assigned_by"), // Admin who made the assignment
  unassignedBy: varchar("unassigned_by"),
  reason: text("reason"), // Reason for assignment/unassignment
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});

// Enhanced Route checks for better tracking
export const routeChecks = pgTable("route_checks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id")
    .notNull()
    .references(() => drivers.id),
  vehicleId: varchar("vehicle_id")
    .notNull()
    .references(() => vehiclesKycDocuments.id),
  orderId: varchar("order_id").references(() => orders.id),

  // Check details
  checkType: text("check_type").notNull(), // pre_trip, post_trip, delivery, maintenance, safety
  category: text("category").notNull(), // tyre, engine, fuel_system, safety_equipment, general
  status: text("status").notNull(), // pass, fail, warning, needs_attention

  // Documentation
  title: text("title").notNull(),
  description: text("description"),
  notes: text("notes"),
  photoUrls: jsonb("photo_urls"), // Array of photo URLs

  // Location and time
  location: jsonb("location"), // {lat, lng, address}
  checklistItems: jsonb("checklist_items"), // [{item: "Tyre Pressure", status: "pass", notes: ""}]

  // Follow-up
  requiresFollowUp: boolean("requires_follow_up").notNull().default(false),
  followUpDate: timestamp("follow_up_date"),
  resolvedDate: timestamp("resolved_date"),
  resolvedBy: varchar("resolved_by"),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});

// Driver KYC Documents table for driver app integration
export const driversKycDocuments = pgTable("drivers_kyc_documents", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => drivers.id, { onDelete: "cascade" }),
  driversLicense: text("drivers_license"), // Document URL/path
  aadhaar: text("aadhaar"), // Document URL/path
  pan: text("pan"), // Document URL/path
  bankAccountDetails: text("bank_account_details"), // Document URL/path
  status: text("status"), // pending, submitted, verified, rejected
  remarks: text("remarks"), // Admin comments
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  driver: varchar("driver")
    .notNull()
    .references(() => drivers.id, { onDelete: "cascade" }),
});

// Vehicle KYC Documents table for driver app integration
export const vehiclesKycDocuments = pgTable("vehicles_kyc_documents", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => drivers.id, { onDelete: "cascade" }),
  numberPlate: text("number_plate"), // Document URL/path
  pesoLicense: text("peso_license"), // Document URL/path
  calibrationLicense: text("calibration_license"), // Document URL/path
  insurance: text("insurance"), // Document URL/path
  fireExtinguisherCertificate: text("fire_extinguisher_certificate"), // Document URL/path
  status: text("status"), // pending, submitted, verified, rejected
  remarks: text("remarks"), // Admin comments
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  driver: varchar("driver")
    .notNull()
    .references(() => drivers.id, { onDelete: "cascade" }),
});

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOtpSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerAddressSchema = createInsertSchema(
  customerAddresses,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(
  systemSettings,
).omit({
  id: true,
  updatedAt: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  totalDeliveries: true,
  successfulDeliveries: true,
  deliveriesThisMonth: true,
  rating: true,
  joinedDate: true,
  createdAt: true,
  updatedAt: true,
});

// export const insertVehicleSchema = createInsertSchema(vehicles).omit({
//   id: true,
//   currentFuelLevel: true,
//   currentKms: true,
//   createdAt: true,
//   updatedAt: true,
// });

export const insertDriverVehicleAssignmentSchema = createInsertSchema(
  driverVehicleAssignments,
).omit({
  id: true,
  assignedDate: true,
  isActive: true,
  createdAt: true,
});

export const insertRouteCheckSchema = createInsertSchema(routeChecks).omit({
  id: true,
  requiresFollowUp: true,
  createdAt: true,
});

export const insertDriversKycDocumentsSchema = createInsertSchema(
  driversKycDocuments,
).omit({
  id: true,
});

export const insertVehiclesKycDocumentsSchema = createInsertSchema(
  vehiclesKycDocuments,
).omit({
  id: true,
});

// Types
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type User = Customer; // Alias for backward compatibility

export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;
export type CustomerAddress = typeof customerAddresses.$inferSelect;

export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

// export type Vehicle = typeof vehicles.$inferSelect;
// export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type DriverVehicleAssignment =
  typeof driverVehicleAssignments.$inferSelect;
export type InsertDriverVehicleAssignment = z.infer<
  typeof insertDriverVehicleAssignmentSchema
>;

export type RouteCheck = typeof routeChecks.$inferSelect;
export type InsertRouteCheck = z.infer<typeof insertRouteCheckSchema>;

export type DriversKycDocuments = typeof driversKycDocuments.$inferSelect;
export type InsertDriversKycDocuments = z.infer<
  typeof insertDriversKycDocumentsSchema
>;

export type VehiclesKycDocuments = typeof vehiclesKycDocuments.$inferSelect;
export type InsertVehiclesKycDocuments = z.infer<
  typeof insertVehiclesKycDocumentsSchema
>;


export const sampleTable = pgTable("sample_table", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  // 👉 Foreign key to customers table
  customerId: varchar("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),

  // 👉 2 random normal fields
  valueOne: text("value_one").notNull(),
  valueTwo: integer("value_two").notNull(),

  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
});
export const insertSampleSchema = createInsertSchema(sampleTable).omit({
  id: true,
  createdAt: true,
});
export type Sample = typeof sampleTable.$inferSelect;
export type InsertSample = z.infer<typeof insertSampleSchema>;
