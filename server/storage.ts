import {
  customers,
  orders,
  payments,
  otpVerifications,
  savedAddresses,
  systemSettings,
  notifications,
  type Customer,
  type InsertCustomer,
  type Order,
  type InsertOrder,
  type Payment,
  type InsertPayment,
  type OtpVerification,
  type InsertOtp,
  type SavedAddress,
  type InsertSavedAddress,
  type SystemSetting,
  type InsertSystemSetting,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lt, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Customer methods
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByUsername(username: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer>;

  // OTP methods
  createOtp(otp: InsertOtp): Promise<OtpVerification>;
  getValidOtp(
    identifier: string,
    otp: string,
  ): Promise<OtpVerification | undefined>;
  markOtpVerified(id: string): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;

  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getUserOrders(customerId: string, limit?: number): Promise<Order[]>;
  updateOrderStatus(
    id: string,
    status: string,
    driverId?: string,
  ): Promise<Order>;
  generateOrderNumber(): Promise<string>;

  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByOrder(orderId: string): Promise<Payment | undefined>;
  updatePaymentStatus(
    id: string,
    status: string,
    transactionId?: string,
  ): Promise<Payment>;



  // Saved Address methods
  createSavedAddress(address: InsertSavedAddress): Promise<SavedAddress>;
  getUserSavedAddresses(userId: string): Promise<SavedAddress[]>;
  getSavedAddress(id: string): Promise<SavedAddress | undefined>;
  updateSavedAddress(
    id: string,
    updates: Partial<InsertSavedAddress>,
  ): Promise<SavedAddress>;
  deleteSavedAddress(id: string): Promise<void>;
  setDefaultAddress(userId: string, addressId: string): Promise<void>;

  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // System Settings methods
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  getSystemSettingsByCategory(category: string): Promise<SystemSetting[]>;
  updateSystemSetting(
    key: string,
    value: string,
    updatedBy?: string,
  ): Promise<SystemSetting>;
  createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
}

export class DatabaseStorage implements IStorage {
  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async getCustomerByUsername(username: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.username, username));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  // Backward compatibility wrappers (remove after routes updated)
  async getUser(id: string): Promise<Customer | undefined> {
    return this.getCustomer(id);
  }

  async getUserByPhone(phone: string): Promise<Customer | undefined> {
    return this.getCustomerByPhone(phone);
  }

  async getUserByEmail(email: string): Promise<Customer | undefined> {
    return this.getCustomerByEmail(email);
  }

  async getUserByUsername(username: string): Promise<Customer | undefined> {
    return this.getCustomerByUsername(username);
  }

  async createUser(insertCustomer: InsertCustomer): Promise<Customer> {
    return this.createCustomer(insertCustomer);
  }

  async updateUser(id: string, updates: Partial<InsertCustomer>): Promise<Customer> {
    return this.updateCustomer(id, updates);
  }

  // OTP methods
  async createOtp(insertOtp: InsertOtp): Promise<OtpVerification> {
    const [otp] = await db
      .insert(otpVerifications)
      .values(insertOtp)
      .returning();
    return otp;
  }

  async getValidOtp(
    identifier: string,
    otp: string,
  ): Promise<OtpVerification | undefined> {
    const [verification] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.identifier, identifier),
          eq(otpVerifications.otp, otp),
          eq(otpVerifications.isVerified, false),
          gte(otpVerifications.expiresAt, new Date()),
        ),
      );
    return verification || undefined;
  }

  async markOtpVerified(id: string): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ isVerified: true })
      .where(eq(otpVerifications.id, id));
  }

  async cleanupExpiredOtps(): Promise<void> {
    await db
      .delete(otpVerifications)
      .where(lt(otpVerifications.expiresAt, new Date()));
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const orderNumber = await this.generateOrderNumber();
    const [order] = await db
      .insert(orders)
      .values({ ...insertOrder, orderNumber })
      .returning();
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getUserOrders(
    customerId: string,
    limit: number = 20,
  ): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async updateOrderStatus(
    id: string,
    status: string,
    driverId?: string,
  ): Promise<Order> {
    const updates: any = { status: status as any, updatedAt: new Date() };
    // do not uncomment this line.
    // if (driverId) {
    //   updates.driverId = driverId;
    // }

    // Generate OTP when order goes in_transit
    if (status === "in_transit") {
      updates.deliveryOtp = this.generateDeliveryOtp();
    }

    const [order] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.orderNumber, id)) // Use orderNumber instead of id
      .returning();
    return order;
  }

  generateDeliveryOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `ZAP${timestamp}${random}`;
  }

  // Payment methods
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentByOrder(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId));
    return payment || undefined;
  }

  async updatePaymentStatus(
    id: string,
    status: string,
    transactionId?: string,
  ): Promise<Payment> {
    const updates: any = { status, updatedAt: new Date() };
    if (transactionId) {
      updates.transactionId = transactionId;
    }
    const [payment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }



  // Saved Address methods
  async createSavedAddress(
    insertAddress: InsertSavedAddress,
  ): Promise<SavedAddress> {
    const [address] = await db
      .insert(savedAddresses)
      .values(insertAddress)
      .returning();
    return address;
  }

  async getUserSavedAddresses(userId: string): Promise<SavedAddress[]> {
    return await db
      .select()
      .from(savedAddresses)
      .where(
        and(
          eq(savedAddresses.userId, userId),
          eq(savedAddresses.isActive, true),
        ),
      )
      .orderBy(desc(savedAddresses.isDefault), desc(savedAddresses.createdAt));
  }

  async getSavedAddress(id: string): Promise<SavedAddress | undefined> {
    const [address] = await db
      .select()
      .from(savedAddresses)
      .where(eq(savedAddresses.id, id));
    return address || undefined;
  }

  async updateSavedAddress(
    id: string,
    updates: Partial<InsertSavedAddress>,
  ): Promise<SavedAddress> {
    const [address] = await db
      .update(savedAddresses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(savedAddresses.id, id))
      .returning();
    return address;
  }

  // System Settings methods
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db
      .select()
      .from(systemSettings)
      .orderBy(systemSettings.category, systemSettings.key);
  }

  async getSystemSettingsByCategory(
    category: string,
  ): Promise<SystemSetting[]> {
    return await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.category, category))
      .orderBy(systemSettings.key);
  }

  async updateSystemSetting(
    key: string,
    value: string,
    updatedBy?: string,
  ): Promise<SystemSetting> {
    const [setting] = await db
      .update(systemSettings)
      .set({
        value,
        updatedAt: new Date(),
        ...(updatedBy && { updatedBy }),
      })
      .where(eq(systemSettings.key, key))
      .returning();
    return setting;
  }

  async createSystemSetting(
    insertSetting: InsertSystemSetting,
  ): Promise<SystemSetting> {
    const [setting] = await db
      .insert(systemSettings)
      .values(insertSetting)
      .returning();
    return setting;
  }

  async deleteSavedAddress(id: string): Promise<void> {
    await db
      .update(savedAddresses)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(savedAddresses.id, id));
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    // First, unset all default addresses for the user
    await db
      .update(savedAddresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(savedAddresses.userId, userId));

    // Then set the specified address as default
    await db
      .update(savedAddresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(savedAddresses.id, addressId));
  }

  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    return Number(result[0]?.count || 0);
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
