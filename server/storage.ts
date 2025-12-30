import {
  organizations,
  customers,
  drivers,
  systemSettings,
  notifications,
  organizationAddresses,
  orders,
  payments,
  organizationUsers,
  assets, 
  orderAssets,
  otpVerifications, 
  type InsertOtpVerification,
  type Asset, 
  type InsertAsset, 
  type InsertOrderAsset,
  type Organization,
  type InsertOrganization,
  type Customer,
  type InsertCustomer,
  type Driver,
  type InsertDriver,
  type OrganizationAddress,
  type InsertOrganizationAddress,
  type InsertNotification,
  type Order,
  type InsertOrder,
  type InsertSystemSetting,
  type SystemSetting,
  type Notification,
  type Payment,
  type InsertPayment,
  type OrganizationUser,
  type InsertOrganizationUser,
} from "@shared/schema";

import { db } from "./db";
import { eq,gt, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Auth & Customer
  getCustomer(id: string): Promise<any | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByUsername(username: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer>;
  
  // Organization
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationByCode(code: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization>;
  addOrganizationUser(entry: InsertOrganizationUser): Promise<OrganizationUser>;
  getOrganizationUser(orgId: string, customerId: string): Promise<OrganizationUser | undefined>;
  getUserMembership(customerId: string): Promise<OrganizationUser | undefined>;
  getOrganizationUsers(orgId: string): Promise<OrganizationUser[]>;
  updateOrganizationUserStatus(id: string, status: string, role?: string): Promise<OrganizationUser>;
  
  // Addresses (Sites)
  createOrganizationAddress(address: InsertOrganizationAddress): Promise<OrganizationAddress>;
  getOrganizationAddresses(orgId: string): Promise<OrganizationAddress[]>;
  getOrganizationAddress(id: string): Promise<OrganizationAddress | undefined>;
  updateOrganizationAddress(id: string, updates: Partial<InsertOrganizationAddress>): Promise<OrganizationAddress>;
  deleteOrganizationAddress(id: string): Promise<void>;
  setDefaultAddress(orgId: string, addressId: string): Promise<void>;
  
  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByOrganization(orgId: string): Promise<any[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByGatewayId(gatewayOrderId: string): Promise<Order | undefined>; 
  getUserOrders(customerId: string, limit?: number): Promise<Order[]>;
  getOrganizationOrders(orgId: string, limit?: number): Promise<Order[]>;
  updateOrderStatus(id: string, status: string, driverId?: string): Promise<Order>;
  getOrderWithCreator(id: string): Promise<any | undefined>;
  getDeliveryByOrderId(orderId: string): Promise<any | undefined>;
  getOrderWithDetails(orderId: string): Promise<any | undefined>;

  // Assets & Order Assets
  createAsset(asset: InsertAsset): Promise<Asset>;
  getOrganizationAssets(orgId: string): Promise<Asset[]>;
  deleteAsset(id: string): Promise<void>;
  createOrderAssets(entries: InsertOrderAsset[]): Promise<void>;
  getOrderAssets(orderId: string): Promise<any[]>; // <--- ADDED THIS

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByOrder(orderId: string): Promise<Payment | undefined>;
  getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined>;
  updatePaymentStatus(id: string, status: string, transactionId?: string, gatewayResponse?: any): Promise<Payment>;
  
  // Logistics & Admin
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverByPhone(phone: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getAdminUsers(): Promise<Customer[]>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  updateSystemSetting(key: string, value: string, updatedBy?: string): Promise<SystemSetting>;
  createSystemSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting>;

  // Auth Aliases
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<Customer | undefined>;
  getUserByEmail(email: string): Promise<Customer | undefined>;
  createUser(user: InsertCustomer): Promise<Customer>;

  createOtp(otpData: InsertOtpVerification): Promise<void>;
  verifyOtp(email: string, otp: string, type: string): Promise<boolean>;

}

export class DatabaseStorage implements IStorage {
  // --- Customer ---
  async getCustomer(id: string): Promise<any | undefined> {
    const [result] = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        username: customers.username,
        passwordHash: customers.passwordHash,
        organizationId: organizations.id,
        organizationName: organizations.businessName,
        organizationCode: organizations.organizationCode,
        role: organizationUsers.role,
        kycStatus: organizationUsers.kycStatus,
      })
      .from(customers)
      .leftJoin(organizationUsers, eq(customers.id, organizationUsers.customerId))
      .leftJoin(organizations, eq(organizationUsers.organizationId, organizations.id))
      .where(eq(customers.id, id));
    return result;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(sql`LOWER(${customers.email}) = LOWER(${email})`);
    return customer;
  }

  async getCustomerByUsername(username: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.username, username));
    return customer;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db.update(customers).set({ ...updates, updatedAt: new Date() }).where(eq(customers.id, id)).returning();
    return customer;
  }

  // --- Organizations ---
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationByCode(code: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.organizationCode, code));
    return org;
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(insertOrg).returning();
    return org;
  }

  async updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization> {
    const [org] = await db.update(organizations).set({ ...updates, updatedAt: new Date() }).where(eq(organizations.id, id)).returning();
    return org;
  }

  async addOrganizationUser(entry: InsertOrganizationUser): Promise<OrganizationUser> {
    const [record] = await db.insert(organizationUsers).values(entry).returning();
    return record;
  }

  async getOrganizationUser(orgId: string, customerId: string): Promise<OrganizationUser | undefined> {
    const [record] = await db.select().from(organizationUsers).where(and(eq(organizationUsers.organizationId, orgId), eq(organizationUsers.customerId, customerId)));
    return record;
  }

  async getUserMembership(customerId: string): Promise<OrganizationUser | undefined> {
    const [record] = await db.select().from(organizationUsers).where(eq(organizationUsers.customerId, customerId)).orderBy(desc(organizationUsers.createdAt)).limit(1);
    return record;
  }

  async getOrganizationUsers(orgId: string): Promise<OrganizationUser[]> {
    return await db.select().from(organizationUsers).where(eq(organizationUsers.organizationId, orgId));
  }

  async updateOrganizationUserStatus(id: string, status: string, role?: string): Promise<OrganizationUser> {
    const updates: any = { orgUserStatus: status, updatedAt: new Date() };
    if (role) updates.role = role;
    const [record] = await db.update(organizationUsers).set(updates).where(eq(organizationUsers.id, id)).returning();
    return record;
  }

  // --- Sites (Addresses) ---
  async createOrganizationAddress(address: InsertOrganizationAddress): Promise<OrganizationAddress> {
    const [result] = await db.insert(organizationAddresses).values(address).returning();
    return result;
  }

  async getOrganizationAddresses(orgId: string): Promise<OrganizationAddress[]> {
    return await db.select().from(organizationAddresses).where(and(eq(organizationAddresses.organizationId, orgId), eq(organizationAddresses.isActive, true))).orderBy(desc(organizationAddresses.isDefault), desc(organizationAddresses.createdAt));
  }

  async getOrganizationAddress(id: string): Promise<OrganizationAddress | undefined> {
    const [result] = await db.select().from(organizationAddresses).where(eq(organizationAddresses.id, id));
    return result;
  }

  async updateOrganizationAddress(id: string, updates: Partial<InsertOrganizationAddress>): Promise<OrganizationAddress> {
    const [result] = await db.update(organizationAddresses).set({ ...updates, updatedAt: new Date() }).where(eq(organizationAddresses.id, id)).returning();
    return result;
  }

  async deleteOrganizationAddress(id: string): Promise<void> {
    await db.update(organizationAddresses).set({ isActive: false, updatedAt: new Date() }).where(eq(organizationAddresses.id, id));
  }

  async setDefaultAddress(orgId: string, addressId: string): Promise<void> {
    await db.update(organizationAddresses).set({ isDefault: false }).where(eq(organizationAddresses.organizationId, orgId));
    await db.update(organizationAddresses).set({ isDefault: true }).where(eq(organizationAddresses.id, addressId));
  }

  // --- Orders ---
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }
  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByGatewayId(gatewayOrderId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.gatewayOrderId, gatewayOrderId));
    return order;
  }

  async getUserOrders(customerId: string, limit: number = 20): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.createdByCustomerId, customerId)).orderBy(desc(orders.createdAt)).limit(limit);
  }

  async getOrganizationOrders(orgId: string, limit: number = 50): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.organizationId, orgId)).orderBy(desc(orders.createdAt)).limit(limit);
  }

  async updateOrderStatus(id: string, status: string, driverId?: string): Promise<Order> {
    const updates: any = { orderStatus: status, updatedAt: new Date() };
    if (driverId) updates.acceptedByDriverId = driverId;
    const [order] = await db.update(orders).set(updates).where(eq(orders.id, id)).returning();
    return order;
  }

  async getOrdersByOrganization(orgId: string): Promise<any[]> {
    return await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        orderStatus: orders.orderStatus,
        createdAt: orders.createdAt,
        amount: orders.amount,
        quantity: orders.quantity,
        presetType: orders.presetType,
        creatorName: customers.name,
        deliveryDate: orders.scheduledDate, // Ensure this maps correctly
        deliveryTime: orders.scheduledTimeInterval,
        organizationAddressId: orders.organizationAddressId
      })
      .from(orders)
      .leftJoin(customers, eq(orders.createdByCustomerId, customers.id))
      .where(eq(orders.organizationId, orgId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrderWithDetails(orderId: string): Promise<any | undefined> {
    const [result] = await db
      .select({
        order: orders,
        creatorName: customers.name,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.createdByCustomerId, customers.id))
      .where(eq(orders.id, orderId));
    return result;
  }

  async getOrderWithCreator(id: string): Promise<any | undefined> {
    const [result] = await db
      .select({
        order: orders,
        creatorName: customers.name,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.createdByCustomerId, customers.id))
      .where(eq(orders.id, id));
    return result;
  }

  async getDeliveryByOrderId(orderId: string): Promise<any | undefined> {
    const [result] = await db
      .select({
        driverName: drivers.name,
        driverPhone: drivers.phone,
        driverRating: drivers.rating,
        currentLatitude: drivers.currentLatitude,
        currentLongitude: drivers.currentLongitude,
      })
      .from(drivers)
      .innerJoin(orders, eq(orders.acceptedByDriverId, drivers.id))
      .where(eq(orders.id, orderId));
    return result;
  }

  // --- Assets & Order Assets ---
  async getOrganizationAssets(orgId: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.organizationId, orgId))
      .orderBy(desc(assets.createdAt));
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async deleteAsset(id: string): Promise<void> {
    await db.delete(assets).where(eq(assets.id, id));
  }
  
  async createOrderAssets(entries: InsertOrderAsset[]): Promise<void> {
    if (entries.length === 0) return;
    await db.insert(orderAssets).values(entries);
  }

 

  // ✅ FIXED: Removed 'quantity' from selection, relying on 'volume'
  async getOrderAssets(orderId: string): Promise<any[]> {
    const result = await db
      .select({
        id: orderAssets.id,
        assetId: orderAssets.assetId,
        assetName: assets.name, 
        
        // quantity: orderAssets.quantity,  <-- REMOVED THIS LINE
        
        volume: orderAssets.volume, // This is your actual quantity column
        amount: orderAssets.amount,
        presetType: orderAssets.presetType
      })
      .from(orderAssets)
      .leftJoin(assets, eq(orderAssets.assetId, assets.id))
      .where(eq(orderAssets.orderId, orderId));
    
    return result;
  }

   async createOtp(otpData: InsertOtpVerification): Promise<void> {
    // 1. cleanup old OTPs for this email to prevent spamming/duplicates
    await db.delete(otpVerifications).where(eq(otpVerifications.email, otpData.email));
    
    // 2. insert new
    await db.insert(otpVerifications).values(otpData);
  }

  async verifyOtp(email: string, otp: string, type: string): Promise<boolean> {
    const [record] = await db
      .select()
      .from(otpVerifications)
      .where(and(
        eq(otpVerifications.email, email),
        eq(otpVerifications.otp, otp),
        eq(otpVerifications.type, type),
        gt(otpVerifications.expiresAt, new Date()) // Check if NOT expired
      ));

    if (record) {
      // OTP is valid, consume it (delete it) so it can't be reused
      await db.delete(otpVerifications).where(eq(otpVerifications.id, record.id));
      return true;
    }
    return false;
  }


  // --- Payments ---
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByOrder(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId));
    return payment;
  }

  async getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.transactionId, transactionId));
    return payment;
  }

  async updatePaymentStatus(id: string, status: string, transactionId?: string, gatewayResponse?: any): Promise<Payment> {
    const updates: any = { status, updatedAt: new Date() };
    if (transactionId) updates.transactionId = transactionId;
    if (gatewayResponse) updates.gatewayResponse = gatewayResponse;
    
    const [payment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  // --- Driver & Logistics ---
  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async getDriverByPhone(phone: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.phone, phone));
    return driver;
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const [driver] = await db.insert(drivers).values(insertDriver).returning();
    return driver;
  }

  async updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver> {
    const [driver] = await db.update(drivers).set({ ...updates, updatedAt: new Date() }).where(eq(drivers.id, id)).returning();
    return driver;
  }

  // --- Notifications ---
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql`COUNT(*)`.as("count") }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result[0]?.count || 0);
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true, updatedAt: new Date() }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true, updatedAt: new Date() }).where(eq(notifications.userId, userId));
  }

  // --- Admin Settings ---
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }

  async updateSystemSetting(key: string, value: string, updatedBy?: string): Promise<SystemSetting> {
    const [setting] = await db.update(systemSettings).set({ value, updatedAt: new Date(), updatedBy }).where(eq(systemSettings.key, key)).returning();
    return setting;
  }

  async createSystemSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting> {
    const [setting] = await db.insert(systemSettings).values(insertSetting).returning();
    return setting;
  }

  async getAdminUsers(): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.role, "admin"));
  }

  // --- Auth Aliases ---
  async getUser(id: string) { return this.getCustomer(id); }
  async getUserByUsername(username: string) { return this.getCustomerByUsername(username); }
  async getUserByEmail(email: string) { return this.getCustomerByEmail(email); }
  async createUser(user: InsertCustomer) { return this.createCustomer(user); }
}

export const storage = new DatabaseStorage();