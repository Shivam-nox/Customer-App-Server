import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  bigint,
  varchar,
  timestamp,
  integer,
  decimal,
  jsonb,
  pgEnum,
  boolean,
  bigserial,
  unique
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/////-----Types & Enums -----/////

export const orgUserRoleEnum = pgEnum("org_user_role", [
  "admin",
  "member",
]);

export const orgUserStatusEnum = pgEnum("org_user_status", [
  "waiting_approval",
  "invited",  // Added this for invite flows
  "approved",
  "rejected",
  "removed",
]);

export const kycStatusEnum = pgEnum("kyc_status", [
  "pending",
  "not_started",
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

export const presetTypeEnum = pgEnum("preset_type_enum", [
  "volume",
  "amount",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "success",
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
  "join_request"
]);

// Organizations table

export const organizations = pgTable("organizations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  businessName: text("business_name").notNull(),
 
  industryType: text("industry_type"),

  organizationCode: text("organization_code").unique(),

  panNumber: text("pan_number"),
  panCard: text("pan_card"),

  gstNumber: text("gst_number"),
  gstCertificate: text("gst_certificate"),

  kycStatus: kycStatusEnum("kyc_status"),   // pending, submitted, verified, rejected
  kycRemark: text("kyc_remark"),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),

  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});


// Customers table
export const customers = pgTable("customers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  organizationId: varchar("organization_id")
    .references(() => organizations.id, { onDelete: "set null" }),

  name: text("name").notNull(),

  username: varchar("username", { length: 50 }).unique(),  // keep for now
  email: varchar("email", { length: 255 }).unique().notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),

  passwordHash: text("password_hash"), // for now until moving to auth provider

  role: text("role")
    .notNull()
    .default("employee"), // admin | manager | employee

  kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
 

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});


// The Critical Mapping Table
export const organizationUsers = pgTable("organization_users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  // Link Organization
  organizationId: varchar("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  // Link Customer (User)
  customerId: varchar("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),

  role: text("role").notNull().default("member"), // admin | member
  orgUserStatus: orgUserStatusEnum("org_user_status").notNull().default("waiting_approval"),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
  kycRemark: text("kyc_remark"),
  // Audit who added them (optional but good for B2B)
  reviewedBy: varchar("reviewed_by"), 

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Create unique constraint so a user can't join the same org twice
// (You might need to add this via SQL or drizzle composite key syntax)

// Customer Addresses table
export const organizationAddresses = pgTable("organization_addresses", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  organizationId: varchar("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

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

  pocName: text("poc_name"),
  pocPhone: varchar("poc_phone", { length: 15 }),

  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
},(table) => {
  return {
    // ✅ This makes the 'label' unique per 'organizationId'
    uniqueOrgSiteLabel: unique("unique_org_site_label").on(table.organizationId, table.label),
  };
});



// Orders table
export const orders = pgTable("orders", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  orderNumber: bigint("order_number", { mode: "number" }) // 👈 Key fix
    .notNull()
    .unique(),

  gatewayOrderId: varchar("gateway_order_id", { length: 255 }),
  // 🔗 Relations (NO CASCADE)
  organizationId: varchar("organization_id")
    .references(() => organizations.id, { onDelete: "set null" }),

  organizationAddressId: varchar("organization_address_id")
    .references(() => organizationAddresses.id, { onDelete: "set null" }),

  createdByCustomerId: varchar("created_by_customer_id")
    .references(() => customers.id, { onDelete: "set null" }),

  acceptedByDriverId: varchar("accepted_by_driver_id")
    .references(() => drivers.id, { onDelete: "set null" }),

  deliveryByDriverId: varchar("delivery_by_driver_id")
    .references(() => drivers.id, { onDelete: "set null" }),

  mduId: varchar("mdu_id")
    .references(() => mduControllers.id, { onDelete: "set null" }),

  // paymentId: varchar("payment_id")
  //   .references(() => payments.id, { onDelete: "set null" }),
   assetAdded: boolean("asset_added").default(false),
  // 📦 Order data
  presetType: presetTypeEnum("preset_type").notNull(),
  quantity: integer("quantity").notNull(),

  ratePerLitre: decimal("rate_per_litre", { precision: 10, scale: 2 }),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  deliveryCharges: decimal("delivery_charges", { precision: 10, scale: 2 }),
  gstCharges: decimal("gst_charges", { precision: 10, scale: 2 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  geoFencingRadius: integer("geo_fencing_radius"),
  scheduledDate: timestamp("scheduled_date"),
  scheduledTimeInterval: text("scheduled_time_interval"),

  // 🔐 Security / verification
  orderOtp: varchar("order_otp", { length: 6 }),
  closeOtp: varchar("close_otp", { length: 6 }),
  bypassOtp: varchar("bypass_otp", { length: 6 }),

  orderOtpVerified: boolean("order_otp_verified").default(false),
  closeOtpVerified: boolean("close_otp_verified").default(false),
  bypassOtpVerified: boolean("bypass_otp_verified").default(false),
  geofencingVerified: boolean("geofencing_verified").default(false),

  // 📡 MDU
  sentToMduStatus: boolean("sent_to_mdu_status").default(false),
  finalAmountDispersed: decimal("final_amount_dispersed", { precision: 10, scale: 2 }),
  finalVolumeDispersed: decimal("final_volume_dispersed", { precision: 10, scale: 2 }),

  // 🧾 Meta
  orderStatus: orderStatusEnum("order_status").default("pending"),
  notes: text("notes"),
  

  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// 1. ASSETS TABLE (Fixed Schema)
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Organization Link
  organizationId: varchar("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  // Asset Number: Auto-incrementing BigInt
 assetNumber: bigint("asset_number", { mode: "number" }) // 👈 Key fix
    .notNull()
    .unique(),
  
  name: text("name").notNull(),
  
  type: text("type"),       // Optional
  position: text("position"), // Optional
  
  capacity: integer("capacity").notNull(),
  
  vidTag: text("vid_tag"), 
  
  // Optional: Default location (Can be null)
  addressId: varchar("address_id")
    .references(() => organizationAddresses.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});
// ... Make sure you export these types


export const orderAssets = pgTable("order_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  assetId: varchar("asset_id").notNull().references(() => assets.id),
  
  presetType: text("preset_type").notNull(), // 'volume' or 'amount'
  volume: decimal("volume"), // Planned Volume
  amount: decimal("amount"), // Planned Amount
  
  // Delivery Execution Fields
  startTotalizer: decimal("start_totalizer"),
  endTotalizer: decimal("end_totalizer"),
  finalVolumeDispensed: decimal("final_volume_dispensed"),
  transactionId: varchar("transaction_id"),
  
  updatedAt: timestamp("updated_at").default(sql`now()`),
});
 
export type Asset = typeof assets.$inferSelect;

// [CRITICAL] We keep 'assetNumber' required here so TypeScript forces us to provide it
export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type InsertOrderAsset = typeof orderAssets.$inferInsert;

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
  orderId: varchar("order_id").references(() => orders.id),
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


export const vehicles = pgTable("vehicles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  registrationNumber: text("registration_number")
    .notNull()
    .unique(),

  capacity: integer("capacity"),    // in liters
  make: text("make"),              // vehicle brand / model
  year: integer("year"),           // manufacturing year

  status: text("status"),          // active / inactive / under_maintenance
  kycStatus: text("kyc_status"),   // pending / submitted / verified / rejected
  kycRemark: text("kyc_remark"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),

  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});


export const drivers = pgTable("drivers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  // organizationId: varchar("organization_id")
  //   .notNull()
  //   .references(() => organizations.id, { onDelete: "cascade" }),

  username: text("username").unique(),
  pin: text("pin").notNull(),

  name: text("name").notNull(),
  phone: text("phone").unique().notNull(),
  email: text("email"),

  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  landmark: text("landmark"),
  area: text("area"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),

  vehicleNumber: text("vehicle_number"),

  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 7 }),
  currentLongitude: decimal("current_longitude", { precision: 10, scale: 7 }),
  kycStatus: kycStatusEnum("kyc_status"), // pending, submitted, verified, rejected

  // isActive: boolean("is_active").notNull().default(true),

  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),

  totalDeliveries: integer("total_deliveries").default(0),
  successfulDeliveries: integer("successful_deliveries").default(0),
  deliveriesThisMonth: integer("deliveries_this_month").default(0),

  lastCheckIn: timestamp("last_check_in"),
  joinedDate: timestamp("joined_date").default(sql`now()`),

  activityStatus: text("status"), // online/offline/in-transit

  profilePhoto: text("profile_photo"),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});

// Driver-Vehicle assignment tracking
export const driverVehicleAssignments = pgTable("driver_vehicle_assignments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  driverId: varchar("driver_id")
    .notNull()
    .references(() => drivers.id, { onDelete: "cascade" }),
  
  vehicleId: varchar("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),

  assignedAt: timestamp("assigned_at")
    .notNull()
    .default(sql`now()`),

  unassignedAt: timestamp("unassigned_at"), // NULL → still assigned
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

export const driversKycDocuments = pgTable("driver_kyc_documents", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  driverId: varchar("driver_id")
    .notNull()
    .references(() => drivers.id, { onDelete: "cascade" }),

  panNumber: text("pan_number"),
  panCard: text("pan_card"),
  drivingLicenseNumber: text("driving_license_number"),
  drivingLiscenseExpiry: timestamp("driving_license_expiry"),
  adhaarNumber: text("adhaar_number"),
  adhaarCard: text("adhaar_card"),

  kycRemark: text("kyc_remark"),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),

  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});



// Vehicle KYC Documents table for driver app integration
export const vehiclesKycDocuments = pgTable("vehicles_kyc_documents", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  // Vehicle ID – the KYC belongs to THIS vehicle
  vehicleId: varchar("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),

  // Uploaded documents
  numberPlate: text("number_plate"), 
  pesoLicense: text("peso_license"),
  calibrationLicense: text("calibration_license"),
  insurance: text("insurance"),
  fireExtinguisherCertificate: text("fire_extinguisher_certificate"),

  // KYC workflow
  kycStatus: kycStatusEnum("kyc_status"),               // pending / submitted / verified / rejected
  remarks: text("remarks"),             // admin comments
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),

  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),

  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
});



export const mduControllers = pgTable("mdu_controllers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  mduCode: varchar("mdu_code", { length: 50 }).notNull().unique(),
  mduNumber:bigserial("mdu_number", { mode: "bigint" }).notNull().unique(),
  ipAddress: varchar("ip_address", { length: 50 }),

  mduVersion: varchar("mdu_version", { length: 20 }),

  vehicleId: varchar("vehicle_id")
    .references(() => vehicles.id, { onDelete: "set null" }),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),

  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});


export const mduDayWiseData = pgTable("mdu_day_wise_data", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  mduId: varchar("mdu_id")
    .notNull()
    .references(() => mduControllers.id, { onDelete: "cascade" }),

  timestamp: timestamp("timestamp").notNull(),

  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),

  gpsStatus: text("gps_status"),              // on/off/lost
  dispenserStatus: text("dispenser_status"),  // active/inactive
  wgtStatus: text("wgt_status"),              // working/not_working

  signalStrength4G: integer("signal_strength_4g"), // RSSI value 0-100

  extraJson: jsonb("extra_json"), // any additional meta

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});


export const payments = pgTable("payments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  // 🔗 Relations
  orderId: varchar("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "set null" }),
    // ❌ no cascade (orders are legal records)

  organizationId: varchar("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
    // ✔ org delete → payments delete (B2B scoped)

  customerId: varchar("customer_id")
    .references(() => customers.id, { onDelete: "set null" }),

  // 💰 Payment data
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

  method: paymentMethodEnum("method").notNull(),

  verification_status: paymentStatusEnum("status")
    .notNull()
    .default("pending"),

  transactionId: varchar("transaction_id", { length: 100 }),

  gatewayResponse: jsonb("gateway_response"),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),

  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});



export const insertMduControllerSchema = createInsertSchema(mduControllers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMduController = z.infer<typeof insertMduControllerSchema>;
export type MduController = typeof mduControllers.$inferSelect;


export const insertMduDayWiseDataSchema = createInsertSchema(mduDayWiseData).omit({
  id: true,
  createdAt: true,
});

export type InsertMduDayWiseData = z.infer<typeof insertMduDayWiseDataSchema>;
export type MduDayWiseData = typeof mduDayWiseData.$inferSelect;


// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// export const insertOtpSchema = createInsertSchema(otpVerifications).omit({
//   id: true,
//   createdAt: true,
// });

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
 
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationUserSchema = createInsertSchema(organizationUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrganizationUser = z.infer<typeof insertOrganizationUserSchema>;
export type OrganizationUser = typeof organizationUsers.$inferSelect;
export const insertCustomerAddressSchema = createInsertSchema(
  organizationAddresses,
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
  assignedAt: true,   // backend auto defaults this
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


export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrganizationInput = z.infer<typeof insertOrganizationSchema>;


export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// Types
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type User = Customer; // Alias for backward compatibility

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

export type DriverKycDocument = typeof driversKycDocuments.$inferSelect;
export type InsertDriverKycDocument = typeof driversKycDocuments.$inferInsert;

export type OrganizationAddress = typeof organizationAddresses.$inferSelect;
export type InsertOrganizationAddress = typeof organizationAddresses.$inferInsert;


// export type InsertOtp = z.infer<typeof insertOtpSchema>;
// export type OtpVerification = typeof otpVerifications.$inferSelect;

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


// ... existing imports ...

// 1. BANK DOCUMENTS TABLE
export const bankDocuments = pgTable("bank_documents", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  // Polymorphic Relation: Connects to either "driver" or "organization"
  ownerType: text("owner_type").notNull(), // e.g., 'driver', 'organization'
  ownerRefId: varchar("owner_ref_id").notNull(), // The ID of the driver/org

  bankAccountNumber: text("bank_account_number").notNull(),
  bankIfscCode: text("bank_ifsc_code").notNull(),
  bankAccountHolderName: text("bank_account_holder_name").notNull(),
  bankName: text("bank_name").notNull(),
  
  documentUrl: text("document_url"), // URL for cancelled cheque/passbook

  // Tracking status
  status: kycStatusEnum("status").default("pending").notNull(),
  remarks: text("remarks"),

  submittedAt: timestamp("submitted_at").default(sql`now()`),
  reviewedAt: timestamp("reviewed_at"),
  
  lastUpdatedAt: timestamp("last_updated_at")
    .default(sql`now()`)
    .notNull(),
});

// 2. INSERT SCHEMA (For Zod Validation)
export const insertBankDocumentSchema = createInsertSchema(bankDocuments).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  lastUpdatedAt: true,
});

// 3. TYPES (For TypeScript)
export type BankDocument = typeof bankDocuments.$inferSelect;
export type InsertBankDocument = z.infer<typeof insertBankDocumentSchema>;