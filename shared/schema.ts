import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, jsonb, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["customer", "driver", "admin"]);
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "submitted", "verified", "rejected"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "in_transit", "delivered", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "processing", "completed", "failed", "refunded"]);
export const paymentMethodEnum = pgEnum("payment_method", ["upi", "cards", "netbanking", "wallet", "cod"]);
export const notificationTypeEnum = pgEnum("notification_type", ["order_update", "payment", "kyc", "delivery", "general"]);

// Customers table  
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  role: userRoleEnum("role").default("customer").notNull(),
  kycStatus: kycStatusEnum("kyc_status").default("pending").notNull(),
  kycDocuments: jsonb("kyc_documents"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Saved Addresses table
export const savedAddresses = pgTable("saved_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// OTP verification table
export const otpVerifications = pgTable("otp_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: varchar("identifier", { length: 255 }).notNull(), // phone or email
  otp: varchar("otp", { length: 6 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // "phone" or "email"
  isVerified: boolean("is_verified").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number", { length: 20 }).unique().notNull(),
  customerId: varchar("customer_id").notNull(),
  quantity: integer("quantity").notNull(),
  ratePerLiter: decimal("rate_per_liter", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryCharges: decimal("delivery_charges", { precision: 10, scale: 2 }).notNull(),
  gst: decimal("gst", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryAddressId: varchar("delivery_address_id").references(() => savedAddresses.id),
  deliveryLatitude: decimal("delivery_latitude", { precision: 10, scale: 7 }),
  deliveryLongitude: decimal("delivery_longitude", { precision: 10, scale: 7 }),
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: varchar("scheduled_time", { length: 5 }).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  driverId: varchar("driver_id"),
  deliveryOtp: varchar("delivery_otp", { length: 6 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  customerId: varchar("customer_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  transactionId: varchar("transaction_id", { length: 100 }),
  gatewayResponse: jsonb("gateway_response"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});



// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  orderId: varchar("order_id"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// System settings table for configurable constants
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 50 }).notNull().unique(),
  value: text("value").notNull(),
  dataType: varchar("data_type", { length: 20 }).notNull().default("number"),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull().default("pricing"),
  isEditable: boolean("is_editable").default(true).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
  updatedBy: varchar("updated_by"),
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



export const insertSavedAddressSchema = createInsertSchema(savedAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertSavedAddress = z.infer<typeof insertSavedAddressSchema>;
export type SavedAddress = typeof savedAddresses.$inferSelect;

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
