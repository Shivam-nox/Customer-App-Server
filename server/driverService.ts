import type { Order, User } from "@shared/schema";

// Enhanced notification payload for driver app with comprehensive order details
interface DriverOrderNotification {
  // Basic order information
  message: string;
  orderId: string;
  orderNumber: string;
  action: string;

  // Customer details for contact and delivery
  customer: {
    name: string;
    phone: string;
    email: string;
  };

  // Order details for delivery preparation
  orderDetails: {
    quantity: number;
    fuelType: string;
    deliveryAddress: string;
    deliveryCoordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  // Delivery scheduling information
  delivery: {
    scheduledDate: string;
    scheduledTime: string;
    deliveryInstructions?: string;
  };

  // Financial details for reference
  payment: {
    totalAmount: string;
    paymentMethod: string;
    ratePerLiter: string;
    deliveryCharges: string;
    gst: string;
  };
}

export class DriverService {
  private driverAppUrl: string;
  private apiSecret: string;

  constructor() {
    this.driverAppUrl = process.env.DRIVER_APP_URL || "";
    this.apiSecret = process.env.CUSTOMER_APP_KEY || "";

    // Remove trailing slash from URL to prevent double slashes
    if (this.driverAppUrl.endsWith("/")) {
      this.driverAppUrl = this.driverAppUrl.slice(0, -1);
    }

    if (!this.driverAppUrl) {
      console.warn("DRIVER_APP_URL not configured");
    }
    if (!this.apiSecret) {
      console.warn("CUSTOMER_APP_KEY not configured");
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.driverAppUrl || !this.apiSecret) {
        console.log("Driver app integration not configured");
        return false;
      }

      const response = await fetch(`${this.driverAppUrl}/api/test`, {
        method: "GET",
        headers: {
          "x-api-secret": this.apiSecret,
          "Content-Type": "application/json",
        },
      });

      const isConnected = response.ok;
      console.log(
        `Driver app connection test: ${isConnected ? "SUCCESS" : "FAILED"}`,
      );

      if (!isConnected) {
        console.log(
          `Response status: ${response.status}, ${response.statusText}`,
        );
      }

      return isConnected;
    } catch (error) {
      console.error("Driver app connection test failed:", error);
      return false;
    }
  }

  /**
   * Notify driver app about new order with comprehensive details
   * Sends customer info, order details, delivery schedule, and payment info
   */
  async notifyNewOrder(order: Order, customer: User): Promise<boolean> {
    try {
      if (!this.driverAppUrl || !this.apiSecret) {
        console.log(
          "Driver app integration not configured - skipping notification",
        );
        return false;
      }

      // Prepare comprehensive order notification with all necessary details
      const orderNotification: DriverOrderNotification = {
        // Basic order information
        message: `New delivery request from ${customer.name}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        action: "new_order",

        // Customer contact and identification details
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        },

        // Order specifications for delivery preparation
        orderDetails: {
          quantity: order.quantity,
          fuelType: "Diesel", // Standard fuel type for the platform
          deliveryAddress: order.deliveryAddress,
          ...(order.deliveryLatitude &&
            order.deliveryLongitude && {
              deliveryCoordinates: {
                latitude: parseFloat(order.deliveryLatitude),
                longitude: parseFloat(order.deliveryLongitude),
              },
            }),
        },

        // Delivery timing and logistics information
        delivery: {
          scheduledDate: order.scheduledDate.toISOString().split("T")[0], // YYYY-MM-DD format
          scheduledTime: order.scheduledTime,
          deliveryInstructions: `Contact ${customer.name} at ${customer.phone} upon arrival`,
        },

        // Financial details for driver reference
        payment: {
          totalAmount: order.totalAmount,
          paymentMethod: "Prepaid", // Orders are paid before delivery
          ratePerLiter: order.ratePerLiter,
          deliveryCharges: order.deliveryCharges,
          gst: order.gst,
        },
      };

      // Log comprehensive order notification details
      console.log(`\n🚚 =================================`);
      console.log(`📦 NOTIFYING DRIVER ABOUT NEW ORDER`);
      console.log(`🚚 =================================`);
      console.log(`📋 Order: ${order.orderNumber}`);
      console.log(`👤 Customer: ${customer.name} (${customer.phone})`);
      console.log(`⛽ Quantity: ${order.quantity} liters`);
      console.log(`📍 Address: ${order.deliveryAddress}`);
      console.log(
        `📅 Scheduled: ${order.scheduledDate.toISOString().split("T")[0]} at ${order.scheduledTime}`,
      );
      console.log(`💰 Amount: ₹${order.totalAmount}`);
      console.log(`🔗 Driver URL: ${this.driverAppUrl}/api/notifications`);
      console.log(`🔑 API Secret: ${this.apiSecret}`);

      // Send detailed notification to driver app
      const response = await fetch(`${this.driverAppUrl}/api/notifications`, {
        method: "POST",
        headers: {
          "x-api-secret": this.apiSecret,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderNotification),
      });

      const success = response.ok;

      // Log notification result with detailed status
      if (success) {
        console.log(`\n✅ SUCCESS: Driver notification sent successfully!`);
        console.log(`📱 Driver app received comprehensive order details`);
        console.log(`📋 Order ${order.orderNumber} - Driver can now see:`);
        console.log(
          `   • Customer contact: ${customer.name} (${customer.phone})`,
        );
        console.log(`   • Delivery location: ${order.deliveryAddress}`);
        console.log(`   • Fuel quantity: ${order.quantity} liters`);
        console.log(
          `   • Scheduled delivery: ${order.scheduledDate.toISOString().split("T")[0]} ${order.scheduledTime}`,
        );
        console.log(`   • Payment amount: ₹${order.totalAmount}`);
        console.log(`🚚 =================================\n`);
      } else {
        console.error(`\n❌ FAILED: Driver notification failed!`);
        console.error(`📱 Driver app did not receive order details`);
        console.error(`🔥 Response: ${response.status} ${response.statusText}`);

        const errorText = await response.text().catch(() => "Unknown error");
        console.error(`📄 Error details:`, errorText);

        // Enhanced error logging for different failure scenarios
        if (response.status === 401) {
          console.error(
            `🔑 Authentication failed - check CUSTOMER_APP_KEY secret`,
          );
        } else if (response.status === 400) {
          console.error(
            `📝 Request validation failed - driver app may expect different payload structure`,
          );
        } else if (response.status === 404) {
          console.error(
            `🔍 Endpoint not found - check driver app URL and /api/notifications path`,
          );
        } else if (response.status >= 500) {
          console.error(
            `💥 Driver app server error - check driver app server status`,
          );
        }
        console.log(`🚚 =================================\n`);
      }

      return success;
    } catch (error) {
      console.error(
        `\n💥 EXCEPTION: Error sending order details to driver app`,
      );
      console.error(`📋 Order: ${order.orderNumber}`);
      console.error(`👤 Customer: ${customer.name}`);
      console.error(`🔥 Error:`, error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error(
          `🌐 Network error - check if driver app URL is accessible`,
        );
      }
      console.log(`🚚 =================================\n`);
      return false;
    }
  }

  async sendOtpToDriver(orderNumber: string, otp: string): Promise<boolean> {
    console.log(
      `🚀 ENTERING sendOtpToDriver function - Order: ${orderNumber}, OTP: ${otp}`,
    );

    try {
      console.log(`🔍 Driver service configuration check:`);
      console.log(`   - Driver App URL: ${this.driverAppUrl || "NOT_SET"}`);
      console.log(`   - API Secret exists: ${!!this.apiSecret}`);
      console.log(
        `   - API Secret preview: ${this.apiSecret ? this.apiSecret.substring(0, 20) + "..." : "NOT_SET"}`,
      );

      if (!this.driverAppUrl || !this.apiSecret) {
        console.log(
          "❌ Driver app integration not configured - skipping OTP notification",
        );
        return false;
      }

      const otpNotification = {
        orderId: orderNumber,
        otp: otp,
        action: "otp_generated",
      };

      console.log(`📱 Preparing to send OTP to driver app:`);
      console.log(`   - Order Number: ${orderNumber}`);
      console.log(`   - OTP: ${otp}`);
      console.log(`   - Payload:`, JSON.stringify(otpNotification, null, 2));
      console.log(`   - Target URL: ${this.driverAppUrl}/api/notifications`);

      const requestHeaders = {
        "x-api-secret": this.apiSecret,
        "Content-Type": "application/json",
      };
      console.log(`📋 Request headers:`, {
        "x-api-secret": this.apiSecret.substring(0, 10) + "...",
        "Content-Type": "application/json",
      });

      console.log(`🌐 Making HTTP POST request to driver app...`);
      const response = await fetch(`${this.driverAppUrl}/api/notifications`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(otpNotification),
      });

      console.log(`📨 HTTP Response received:`);
      console.log(`   - Status: ${response.status} ${response.statusText}`);
      console.log(`   - OK: ${response.ok}`);
      console.log(
        `   - Headers:`,
        Object.fromEntries(response.headers.entries()),
      );

      const success = response.ok;

      if (success) {
        console.log(
          `✅ Successfully sent OTP to driver app for order ${orderNumber}`,
        );
        try {
          const responseText = await response.text();
          console.log(`📄 Response body:`, responseText);
        } catch (e) {
          console.log(`📄 Could not read response body`);
        }
      } else {
        console.error(
          `❌ Failed to send OTP to driver app: ${response.status} ${response.statusText}`,
        );
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Driver app OTP error response:", errorText);

        // Log specific issues to help debugging
        if (response.status === 401) {
          console.error(
            "🔑 Authentication failed - check CUSTOMER_APP_KEY secret",
          );
        } else if (response.status === 400) {
          console.error(
            "📝 Request validation failed - check payload structure",
          );
        } else if (response.status === 404) {
          console.error(
            "🔍 Endpoint not found - check driver app URL and /api/notifications path",
          );
        } else if (response.status >= 500) {
          console.error("💥 Driver app server error - check driver app logs");
        }
      }

      console.log(
        `🔚 sendOtpToDriver function completed with result: ${success}`,
      );
      return success;
    } catch (error) {
      console.error("💥 ERROR in sendOtpToDriver:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error(
          "🌐 Network error - check if driver app URL is accessible",
        );
      }
      return false;
    }
  }

  async getIntegrationInfo() {
    return {
      driverAppUrl: this.driverAppUrl,
      hasApiSecret: !!this.apiSecret,
      endpoints: {
        test: `${this.driverAppUrl}/api/test`,
        notifications: `${this.driverAppUrl}/api/notifications`,
        integrationInfo: `${this.driverAppUrl}/api/integration-info`,
      },
      headers: {
        "x-api-secret": this.apiSecret ? "[CONFIGURED]" : "[MISSING]",
        "Content-Type": "application/json",
      },
    };
  }
}

export const driverService = new DriverService();
