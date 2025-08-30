import type { Order, User } from "@shared/schema";

interface DriverOrderNotification {
  message: string;
  orderId: string;
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

  async notifyNewOrder(order: Order, customer: User): Promise<boolean> {
    try {
      if (!this.driverAppUrl || !this.apiSecret) {
        console.log(
          "Driver app integration not configured - skipping notification",
        );
        return false;
      }

      const orderNotification: DriverOrderNotification = {
        message: `Customer has placed an order: ${order.orderNumber}`,
        orderId: order.id,
      };

      console.log(`Notifying driver app about new order: ${order.orderNumber}`);
      console.log(`Using API secret: ${this.apiSecret.substring(0, 10)}...`);
      console.log(`Driver URL: ${this.driverAppUrl}/api/notifications`);

      const response = await fetch(`${this.driverAppUrl}/api/notifications`, {
        method: "POST",
        headers: {
          "x-api-secret": this.apiSecret,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderNotification),
      });

      const success = response.ok;

      if (success) {
        console.log(
          `✅ Successfully notified driver app about order ${order.orderNumber}`,
        );
      } else {
        console.error(
          `❌ Failed to notify driver app: ${response.status} ${response.statusText}`,
        );
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Driver app error response:", errorText);

        // Log specific issues to help debugging
        if (response.status === 401) {
          console.error(
            "🔑 Authentication failed - check CUSTOMER_APP_KEY secret",
          );
        } else if (response.status === 400) {
          console.error(
            "📝 Request validation failed - check payload structure",
          );
        }
      }

      return success;
    } catch (error) {
      console.error("Error notifying driver app:", error);
      return false;
    }
  }

  async sendOtpToDriver(orderNumber: string, otp: string): Promise<boolean> {
    console.log(`🚀 ENTERING sendOtpToDriver function - Order: ${orderNumber}, OTP: ${otp}`);
    
    try {
      console.log(`🔍 Driver service configuration check:`);
      console.log(`   - Driver App URL: ${this.driverAppUrl || 'NOT_SET'}`);
      console.log(`   - API Secret exists: ${!!this.apiSecret}`);
      console.log(`   - API Secret preview: ${this.apiSecret ? this.apiSecret.substring(0, 20) + '...' : 'NOT_SET'}`);
      
      if (!this.driverAppUrl || !this.apiSecret) {
        console.log(
          "❌ Driver app integration not configured - skipping OTP notification",
        );
        return false;
      }

      const otpNotification = {
        orderId: orderNumber,
        otp: otp,
        action: "otp_generated"
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
        "Content-Type": "application/json"
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
      console.log(`   - Headers:`, Object.fromEntries(response.headers.entries()));

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
          console.error(
            "💥 Driver app server error - check driver app logs",
          );
        }
      }

      console.log(`🔚 sendOtpToDriver function completed with result: ${success}`);
      return success;
    } catch (error) {
      console.error("💥 ERROR in sendOtpToDriver:", error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error("🌐 Network error - check if driver app URL is accessible");
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
