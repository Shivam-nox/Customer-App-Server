import type { User } from "@shared/schema";

// Admin dashboard comprehensive customer registration notification payload
interface AdminCustomerNotification {
  // Basic customer information
  id: string;
  name: string;
  username: string | null;
  email: string;
  phone: string;
  
  // Business information
  business_name: string | null;
  business_address: string | null;
  industry_type: string | null;
  gst_number: string | null;
  pan_number: string | null;
  
  // Account information
  role: string;
  kyc_status: string;
  kyc_documents: any | null;
  is_active: boolean;
  
  // Timestamp information
  created_at: string;
  updated_at: string;
  
  // Security note: password_hash intentionally excluded for security
}

/**
 * AdminService - Handles integration with external admin dashboard
 * Sends customer registration notifications when new users sign up
 */
export class AdminService {
  private adminDashboardUrl: string;
  private apiKey: string;

  constructor() {
    // Admin dashboard configuration
    this.adminDashboardUrl = process.env.ADMIN_APP_URL || "NOT_SET";
    this.apiKey = "zapygo-admin-2025-secure-key";

    // Remove trailing slash from URL to prevent double slashes
    if (this.adminDashboardUrl.endsWith("/")) {
      this.adminDashboardUrl = this.adminDashboardUrl.slice(0, -1);
    }

    if (!this.adminDashboardUrl) {
      console.warn("⚠️  Admin dashboard URL not configured");
    }
    if (!this.apiKey) {
      console.warn("⚠️  Admin dashboard API key not configured");
    }
  }

  /**
   * Test connection to admin dashboard
   * Helps verify the integration is working properly
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.adminDashboardUrl || !this.apiKey) {
        console.log("❌ Admin dashboard integration not configured");
        return false;
      }

      // Test endpoint - assuming admin dashboard has a health check
      const response = await fetch(`${this.adminDashboardUrl}/api/health`, {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      const isConnected = response.ok;
      console.log(
        `🔗 Admin dashboard connection test: ${isConnected ? "SUCCESS" : "FAILED"}`,
      );

      if (!isConnected) {
        console.log(
          `📊 Response status: ${response.status}, ${response.statusText}`,
        );
      }

      return isConnected;
    } catch (error) {
      console.error("💥 Admin dashboard connection test failed:", error);
      return false;
    }
  }

  /**
   * Notify admin dashboard about new customer registration
   * Sends customer details immediately after successful signup
   */
  async notifyCustomerRegistration(customer: User): Promise<boolean> {
    try {
      if (!this.adminDashboardUrl || !this.apiKey) {
        console.log(
          "⚠️  Admin dashboard integration not configured - skipping customer registration notification",
        );
        return false;
      }

      // Prepare customer registration payload as specified
      const customerNotification: AdminCustomerNotification = {
        name: customer.name,
        phone: customer.phone,
        username: customer.username || customer.email.split("@")[0], // Use email prefix as fallback if username is null
        email: customer.email,
      };

      // Log detailed customer registration notification
      console.log(`\n🏢 =======================================`);
      console.log(`👤 NOTIFYING ADMIN ABOUT NEW CUSTOMER`);
      console.log(`🏢 =======================================`);
      console.log(`📋 Customer: ${customer.name} (${customer.username})`);
      console.log(`📞 Phone: ${customer.phone}`);
      console.log(`📧 Email: ${customer.email}`);
      console.log(`🆔 User ID: ${customer.id}`);
      console.log(
        `🔗 Admin URL: ${this.adminDashboardUrl}/api/external/customer-registration`,
      );
      console.log(`🔑 API Key: ${this.apiKey.substring(0, 15)}...`);
      console.log(`📦 Payload:`, JSON.stringify(customerNotification, null, 2));

      // Send customer registration notification to admin dashboard
      const response = await fetch(
        `${this.adminDashboardUrl}/api/external/customer-registration`,
        {
          method: "POST",
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(customerNotification),
        },
      );

      const success = response.ok;

      // Log detailed notification result with comprehensive status
      if (success) {
        console.log(
          `\n✅ SUCCESS: Admin dashboard notification sent successfully!`,
        );
        console.log(`🏢 Admin dashboard received new customer details`);
        console.log(
          `👤 Customer ${customer.username} (${customer.name}) registered:`,
        );
        console.log(`   • Name: ${customer.name}`);
        console.log(`   • Phone: ${customer.phone}`);
        console.log(`   • Username: ${customer.username}`);
        console.log(
          `   • Registration time: ${customer.createdAt || new Date().toISOString()}`,
        );
        console.log(`📊 Admin can now:`);
        console.log(`   • Track new customer acquisition`);
        console.log(`   • Monitor user registration trends`);
        console.log(`   • Manage customer database`);
        console.log(`🏢 =======================================\n`);
      } else {
        console.error(`\n❌ FAILED: Admin dashboard notification failed!`);
        console.error(`🏢 Admin dashboard did not receive customer details`);
        console.error(`🔥 Response: ${response.status} ${response.statusText}`);

        const errorText = await response.text().catch(() => "Unknown error");
        console.error(`📄 Error details:`, errorText);

        // Enhanced error logging for different failure scenarios
        if (response.status === 401) {
          console.error(
            `🔑 Authentication failed - check X-API-Key header and admin API key`,
          );
        } else if (response.status === 400) {
          console.error(
            `📝 Request validation failed - admin dashboard may expect different payload structure`,
          );
          console.error(
            `🔍 Expected format: {"name": "string", "phone": "string", "username": "string"}`,
          );
        } else if (response.status === 404) {
          console.error(
            `🔍 Endpoint not found - check admin dashboard URL and /api/external/customer-registration path`,
          );
        } else if (response.status >= 500) {
          console.error(
            `💥 Admin dashboard server error - check admin dashboard server status`,
          );
        }
        console.log(`🏢 =======================================\n`);
      }

      return success;
    } catch (error) {
      console.error(
        `\n💥 EXCEPTION: Error sending customer details to admin dashboard`,
      );
      console.error(`👤 Customer: ${customer.name} (${customer.username})`);
      console.error(`📞 Phone: ${customer.phone}`);
      console.error(`🔥 Error:`, error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error(
          `🌐 Network error - check if admin dashboard URL is accessible`,
        );
      }
      console.log(`🏢 =======================================\n`);
      return false;
    }
  }

  /**
   * Get admin dashboard integration information for debugging
   */
  async getIntegrationInfo() {
    return {
      adminDashboardUrl: this.adminDashboardUrl,
      hasApiKey: !!this.apiKey,
      endpoints: {
        health: `${this.adminDashboardUrl}/api/health`,
        customerRegistration: `${this.adminDashboardUrl}/api/external/customer-registration`,
      },
      headers: {
        "X-API-Key": this.apiKey ? "[CONFIGURED]" : "[MISSING]",
        "Content-Type": "application/json",
      },
      payloadFormat: {
        name: "string (2-100 characters)",
        phone: "string (10-15 characters)",
        username: "string (3-50 characters)",
        email: "string (valid email format)",
      },
    };
  }
}

// Export singleton instance for use across the application
export const adminService = new AdminService();
