import {
  organizations,
  customers,
  drivers,
  systemSettings,
  notifications,
  vehicles,
  driversKycDocuments,
  driverVehicleAssignments,
  organizationAddresses,
  orders,
  payments,
  // types
  type Organization,
  type InsertOrganization,
  type Customer,
  type InsertCustomer,
  type Driver,
  type InsertDriver,
  type Vehicle,
  type InsertVehicle,
  type DriverKycDocument,
  type InsertDriverKycDocument,
  type DriverVehicleAssignment,
  type InsertDriverVehicleAssignment,
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
} from "@shared/schema";

import { db } from "./db";
import { eq, desc, and, gte, lt, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { uuid } from "drizzle-orm/pg-core";



export interface IStorage {
  // Customer methods
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByUsername(username: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(
    id: string,
    updates: Partial<InsertCustomer>
  ): Promise<Customer>;

  // OTP methods
  // createOtp(otp: InsertOtp): Promise<OtpVerification>;
  // getValidOtp(
  //   identifier: string,
  //   otp: string
  // ): Promise<OtpVerification | undefined>;
  // markOtpVerified(id: string): Promise<void>;
  // cleanupExpiredOtps(): Promise<void>;

  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getUserOrders(customerId: string, limit?: number): Promise<Order[]>;
  updateOrderStatus(
    id: string,
    status: string,
    driverId?: string
  ): Promise<Order>;
  // generateOrderNumber(): Promise<string>;

  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByOrder(orderId: string): Promise<Payment | undefined>;
  updatePaymentStatus(
    id: string,
    status: string,
    transactionId?: string
  ): Promise<Payment>;
}

  // Saved Address methods
//   createCustomerAddress(
//     address: InsertCustomerAddress
//   ): Promise<CustomerAddress>;
//   getUserorganizationAddresses(userId: string): Promise<CustomerAddress[]>;
//   getCustomerAddress(id: string): Promise<CustomerAddress | undefined>;
//   updateCustomerAddress(
//     id: string,
//     updates: Partial<InsertCustomerAddress>
//   ): Promise<CustomerAddress>;
//   deleteCustomerAddress(id: string): Promise<void>;
//   setDefaultAddress(userId: string, addressId: string): Promise<void>;

//   // Notification methods
//   createNotification(notification: InsertNotification): Promise<Notification>;
//   getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
//   getUnreadCount(userId: string): Promise<number>;
//   markNotificationRead(id: string): Promise<void>;
//   markAllNotificationsRead(userId: string): Promise<void>;

//   // System Settings methods
//   getSystemSetting(key: string): Promise<SystemSetting | undefined>;
//   getAllSystemSettings(): Promise<SystemSetting[]>;
//   getSystemSettingsByCategory(category: string): Promise<SystemSetting[]>;
//   updateSystemSetting(
//     key: string,
//     value: string,
//     updatedBy?: string
//   ): Promise<SystemSetting>;
//   createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;

//   // Driver methods
//   getDriver(id: string): Promise<Driver | undefined>;
//   getDriverByPhone(phone: string): Promise<Driver | undefined>;
//   createDriver(driver: InsertDriver): Promise<Driver>;
//   updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver>;

//   // Admin methods
//   getAdminUsers(): Promise<Customer[]>;
// }


export interface IStorage {
  // Organization Users (Customers)
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer>;

  // Organization Address methods
  createOrganizationAddress(address: InsertOrganizationAddress): Promise<OrganizationAddress>;
  getOrganizationAddresses(orgId: string): Promise<OrganizationAddress[]>;
  getOrganizationAddress(id: string): Promise<OrganizationAddress | undefined>;
  updateOrganizationAddress(id: string, updates: Partial<InsertOrganizationAddress>): Promise<OrganizationAddress>;
  deleteOrganizationAddress(id: string): Promise<void>;
  setDefaultAddress(orgId: string, addressId: string): Promise<void>;

  // Driver methods
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverByPhone(phone: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver>;

  // Admin methods (Org users with role = admin)
  getAdminUsers(): Promise<Customer[]>;
}

export class DatabaseStorage implements IStorage {
  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    console.log(`🔍 Searching for email: "${email}"`);
    // Use SQL LOWER for true case-insensitive search (works with existing data)
    const [customer] = await db
      .select()
      .from(customers)
      .where(sql`LOWER(${customers.email}) = LOWER(${email})`);
    console.log(`📧 Email search result: ${customer ? `Found ${customer.name}` : 'Not found'}`);
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
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async updateCustomer(
    id: string,
    updates: Partial<InsertCustomer>
  ): Promise<Customer> {
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

  async updateUser(
    id: string,
    updates: Partial<InsertCustomer>
  ): Promise<Customer> {
    return this.updateCustomer(id, updates);
  }

  // // OTP methods
  // async createOtp(insertOtp: InsertOtp): Promise<OtpVerification> {
  //   const [otp] = await db
  //     .insert(otpVerifications)
  //     .values(insertOtp)
  //     .returning();
  //   return otp;
  // }

  // async getValidOtp(
  //   identifier: string,
  //   otp: string
  // ): Promise<OtpVerification | undefined> {
  //   const [verification] = await db
  //     .select()
  //     .from(otpVerifications)
  //     .where(
  //       and(
  //         eq(otpVerifications.identifier, identifier),
  //         eq(otpVerifications.otp, otp),
  //         eq(otpVerifications.isVerified, false),
  //         gte(otpVerifications.expiresAt, new Date())
  //       )
  //     );
  //   return verification || undefined;
  // }

  // async markOtpVerified(id: string): Promise<void> {
  //   await db
  //     .update(otpVerifications)
  //     .set({ isVerified: true })
  //     .where(eq(otpVerifications.id, id));
  // }

  // async cleanupExpiredOtps(): Promise<void> {
  //   await db
  //     .delete(otpVerifications)
  //     .where(lt(otpVerifications.expiresAt, new Date()));
  // }

  // Order methods
async createOrder(insertOrder: InsertOrder): Promise<Order> {
  const [order] = await db
    .insert(orders)
    .values(insertOrder) // the orderNumber auto-increments
    .returning();

  return order;
}


  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getUserOrders(
    customerId: string,
    limit: number = 20
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
  driverId?: string
): Promise<Order> {
  const updates: any = { status: status as any, updatedAt: new Date() };

  if (driverId) {
    updates.driverId = driverId;
  }

  // Har baar "in_transit" set karte waqt naya OTP generate hoga
  if (status === "in_transit") {
    updates.deliveryOtp = this.generateDeliveryOtp();
  }

  const isUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

 
  const whereCondition = isUuid(id)
  ? eq(orders.id, id)
  : eq(orders.orderNumber, BigInt(id));  // Convert string → number

  const [order] = await db
    .update(orders)
    .set(updates)
    .where(
      whereCondition
    )
    .returning();

  return order;
}




  generateDeliveryOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // async generateOrderNumber(): Promise<string> {
  //   const timestamp = Date.now().toString().slice(-6);
  //   const random = Math.floor(Math.random() * 1000)
  //     .toString()
  //     .padStart(3, "0");
  //   return `ZAP${timestamp}${random}`;
  // }

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
    transactionId?: string
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
  // async createCustomerAddress(
  //   insertAddress: InsertCustomerAddress
  // ): Promise<CustomerAddress> {
  //   const [address] = await db
  //     .insert(organizationAddresses)
  //     .values(insertAddress)
  //     .returning();
  //   return address;
  // }
// -----------------------------
// ORGANIZATION ADDRESS METHODS
// -----------------------------
async createOrganizationAddress(
  address: InsertOrganizationAddress
): Promise<OrganizationAddress> {
  const [result] = await db
    .insert(organizationAddresses)
    .values(address)
    .returning();
  return result;
}

async getOrganizationAddresses(
  organizationId: string
): Promise<OrganizationAddress[]> {
  return await db
    .select()
    .from(organizationAddresses)
    .where(
      and(
        eq(organizationAddresses.organizationId, organizationId),
        eq(organizationAddresses.isActive, true)
      )
    )
    .orderBy(
      desc(organizationAddresses.isDefault),
      desc(organizationAddresses.createdAt)
    );
}

async getOrganizationAddress(
  id: string
): Promise<OrganizationAddress | undefined> {
  const [result] = await db
    .select()
    .from(organizationAddresses)
    .where(eq(organizationAddresses.id, id));
  return result || undefined;
}


async updateOrganizationAddress(
  id: string,
  updates: Partial<InsertOrganizationAddress>
): Promise<OrganizationAddress> {
  const [result] = await db
    .update(organizationAddresses)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(organizationAddresses.id, id))
    .returning();
  return result;
}

async deleteOrganizationAddress(id: string): Promise<void> {
  await db
    .update(organizationAddresses)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(organizationAddresses.id, id));
}

async setDefaultAddress(
  organizationId: string,
  addressId: string
): Promise<void> {
  // unset all defaults
  await db
    .update(organizationAddresses)
    .set({ isDefault: false })
    .where(eq(organizationAddresses.organizationId, organizationId));

  // set new default
  await db
    .update(organizationAddresses)
    .set({ isDefault: true })
    .where(eq(organizationAddresses.id, addressId));
}

  // async getCustomerAddress(id: string): Promise<CustomerAddress | undefined> {
  //   const [address] = await db
  //     .select()
  //     .from(organizationAddresses)
  //     .where(eq(organizationAddresses.id, id));
  //   return address || undefined;
  // }

  // async updateCustomerAddress(
  //   id: string,
  //   updates: Partial<InsertCustomerAddress>
  // ): Promise<CustomerAddress> {
  //   const [address] = await db
  //     .update(organizationAddresses)
  //     .set({ ...updates, updatedAt: new Date() })
  //     .where(eq(organizationAddresses.id, id))
  //     .returning();
  //   return address;
  // }

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
    category: string
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
    updatedBy?: string
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
    insertSetting: InsertSystemSetting
  ): Promise<SystemSetting> {
    const [setting] = await db
      .insert(systemSettings)
      .values(insertSetting)
      .returning();
    return setting;
  }

  async deleteCustomerAddress(id: string): Promise<void> {
    await db
      .update(organizationAddresses)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(organizationAddresses.id, id));
  }

  // async setDefaultAddress(userId: string, addressId: string): Promise<void> {
  //   // Get the current address to check if it's already default
  //   const [currentAddress] = await db
  //     .select()
  //     .from(organizationAddresses)
  //     .where(eq(organizationAddresses.id, addressId));

  //   if (!currentAddress) {
  //     throw new Error("Address not found");
  //   }

  //   // If the address is already default, unset it
  //   if (currentAddress.isDefault) {
  //     await db
  //       .update(organizationAddresses)
  //       .set({ isDefault: false, updatedAt: new Date() })
  //       .where(eq(organizationAddresses.id, addressId));
  //   } else {
  //     // First, unset all default addresses for the user
  //     await db
  //       .update(organizationAddresses)
  //       .set({ isDefault: false, updatedAt: new Date() })
  //       .where(eq(organizationAddresses.userId, userId));

  //     // Then set the specified address as default
  //     await db
  //       .update(organizationAddresses)
  //       .set({ isDefault: true, updatedAt: new Date() })
  //       .where(eq(organizationAddresses.id, addressId));
  //   }
  // }

  // Driver methods
  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver || undefined;
  }

  async getDriverByPhone(phone: string): Promise<Driver | undefined> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.phone, phone));
    return driver || undefined;
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const [driver] = await db.insert(drivers).values(insertDriver).returning();
    return driver;
  }

  async updateDriver(
    id: string,
    updates: Partial<InsertDriver>
  ): Promise<Driver> {
    const [driver] = await db
      .update(drivers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  // Admin methods
  async getAdminUsers(): Promise<Customer[]> {
    const admins = await db
      .select()
      .from(customers)
      .where(eq(customers.role, "admin"));
    return admins;
  }

  // Notification methods
  async createNotification(
    insertNotification: InsertNotification
  ): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getUserNotifications(
    userId: string,
    limit: number = 50
  ): Promise<Notification[]> {
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
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
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
