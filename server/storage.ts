import { 
  users, orders, payments, deliveries, notifications, otpVerifications,
  type User, type InsertUser, type Order, type InsertOrder,
  type Payment, type InsertPayment, type Delivery, type InsertDelivery,
  type Notification, type InsertNotification, type OtpVerification, type InsertOtp
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // OTP methods
  createOtp(otp: InsertOtp): Promise<OtpVerification>;
  getValidOtp(identifier: string, otp: string): Promise<OtpVerification | undefined>;
  markOtpVerified(id: string): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;
  
  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getUserOrders(customerId: string, limit?: number): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  generateOrderNumber(): Promise<string>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByOrder(orderId: string): Promise<Payment | undefined>;
  updatePaymentStatus(id: string, status: string, transactionId?: string): Promise<Payment>;
  
  // Delivery methods
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  getDelivery(orderId: string): Promise<Delivery | undefined>;
  updateDriverLocation(orderId: string, latitude: number, longitude: number): Promise<Delivery>;
  markDelivered(orderId: string, proofOfDelivery: string): Promise<Delivery>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // OTP methods
  async createOtp(insertOtp: InsertOtp): Promise<OtpVerification> {
    const [otp] = await db
      .insert(otpVerifications)
      .values(insertOtp)
      .returning();
    return otp;
  }

  async getValidOtp(identifier: string, otp: string): Promise<OtpVerification | undefined> {
    const [verification] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.identifier, identifier),
          eq(otpVerifications.otp, otp),
          eq(otpVerifications.isVerified, false),
          gte(otpVerifications.expiresAt, new Date())
        )
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

  async getUserOrders(customerId: string, limit: number = 20): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
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
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentByOrder(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId));
    return payment || undefined;
  }

  async updatePaymentStatus(id: string, status: string, transactionId?: string): Promise<Payment> {
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

  // Delivery methods
  async createDelivery(insertDelivery: InsertDelivery): Promise<Delivery> {
    const [delivery] = await db
      .insert(deliveries)
      .values(insertDelivery)
      .returning();
    return delivery;
  }

  async getDelivery(orderId: string): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.orderId, orderId));
    return delivery || undefined;
  }

  async updateDriverLocation(orderId: string, latitude: number, longitude: number): Promise<Delivery> {
    const [delivery] = await db
      .update(deliveries)
      .set({ 
        currentLatitude: latitude.toString(),
        currentLongitude: longitude.toString(),
        updatedAt: new Date()
      })
      .where(eq(deliveries.orderId, orderId))
      .returning();
    return delivery;
  }

  async markDelivered(orderId: string, proofOfDelivery: string): Promise<Delivery> {
    const [delivery] = await db
      .update(deliveries)
      .set({ 
        proofOfDelivery,
        deliveredAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(deliveries.orderId, orderId))
      .returning();
    return delivery;
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

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: otpVerifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.length;
  }
}

export const storage = new DatabaseStorage();
