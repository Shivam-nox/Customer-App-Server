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

  // Authentication information
  password_hash: string | null;
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
    this.adminDashboardUrl =
      "https://dfce8961-587a-418c-badd-91e67a04838d-00-1wfu1zybfjof6.kirk.replit.dev";
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
        `🔗 Admin dashboard connection test: ${
          isConnected ? "SUCCESS" : "FAILED"
        }`
      );

      if (!isConnected) {
        console.log(
          `📊 Response status: ${response.status}, ${response.statusText}`
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
          "⚠️  Admin dashboard integration not configured - skipping customer registration notification"
        );
        return false;
      }

      // Prepare comprehensive customer registration payload with all details
      const customerNotification: AdminCustomerNotification = {
        // Basic customer information
        id: customer.id,
        name: customer.name,
        username: customer.username, // Keep null if not provided
        email: customer.email,
        phone: customer.phone,

        // Business information
        business_name: customer.businessName,
        business_address: customer.businessAddress,
        industry_type: customer.industryType,
        gst_number: customer.gstNumber,
        pan_number: customer.panNumber,

        // Account information
        role: customer.role,
        kyc_status: customer.kycStatus,
        kyc_documents: customer.kycDocuments,
        is_active: customer.isActive,

        // Timestamp information
        created_at: customer.createdAt
          ? customer.createdAt.toISOString()
          : new Date().toISOString(),
        updated_at: customer.updatedAt
          ? customer.updatedAt.toISOString()
          : new Date().toISOString(),

        // Authentication information - as requested by admin
        password_hash: customer.passwordHash,
      };

      // Log comprehensive customer registration notification
      console.log(`\n🏢 =======================================`);
      console.log(`👤 NOTIFYING ADMIN ABOUT NEW CUSTOMER`);
      console.log(`🏢 =======================================`);
      console.log(
        `📋 Customer: ${customer.name} (${customer.username || "No username"})`
      );
      console.log(`📞 Phone: ${customer.phone}`);
      console.log(`📧 Email: ${customer.email}`);
      console.log(`🆔 User ID: ${customer.id}`);
      console.log(`🏢 Business: ${customer.businessName || "Not provided"}`);
      console.log(`🏭 Industry: ${customer.industryType || "Not specified"}`);
      console.log(`📄 GST: ${customer.gstNumber || "Not provided"}`);
      console.log(`🪪 PAN: ${customer.panNumber || "Not provided"}`);
      console.log(`👤 Role: ${customer.role}`);
      console.log(`✅ KYC Status: ${customer.kycStatus}`);
      console.log(
        `🔒 Password Hash: ${
          customer.passwordHash ? "Included" : "Not available"
        }`
      );
      console.log(
        `⚠️  Security Note: Password hash is being sent to admin dashboard as requested`
      );
      console.log(
        `🔗 Admin URL: ${this.adminDashboardUrl}/api/external/customer-registration`
      );
      console.log(`🔑 API Key: ${this.apiKey.substring(0, 15)}...`);
      console.log(
        `📦 Full Payload:`,
        JSON.stringify(customerNotification, null, 2)
      );

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
        }
      );

      const success = response.ok;

      // Log detailed notification result with comprehensive status
      if (success) {
        console.log(
          `\n✅ SUCCESS: Admin dashboard notification sent successfully!`
        );
        console.log(
          `🏢 Admin dashboard received comprehensive customer details`
        );
        console.log(
          `👤 Customer ${customer.username || customer.email} (${
            customer.name
          }) registered:`
        );
        console.log(
          `   • Basic Info: ${customer.name}, ${customer.phone}, ${customer.email}`
        );
        console.log(
          `   • Business: ${customer.businessName || "Not provided"} (${
            customer.industryType || "No industry"
          })`
        );
        console.log(
          `   • Tax Info: GST ${customer.gstNumber || "None"}, PAN ${
            customer.panNumber || "None"
          }`
        );
        console.log(
          `   • Account: ${customer.role} role, KYC ${customer.kycStatus}, Active: ${customer.isActive}`
        );
        console.log(
          `   • Registration: ${
            customer.createdAt
              ? customer.createdAt.toISOString()
              : new Date().toISOString()
          }`
        );
        console.log(
          `   • Security: Password hash ${
            customer.passwordHash ? "included" : "not available"
          }`
        );
        console.log(
          `📊 Admin dashboard now has complete customer data including:`
        );
        console.log(`   • Full business registration details`);
        console.log(`   • KYC status and documents`);
        console.log(`   • Account management information`);
        console.log(`   • Complete audit trail with timestamps`);
        console.log(`   • Password hash for authentication management`);
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
            `🔑 Authentication failed - check X-API-Key header and admin API key`
          );
        } else if (response.status === 400) {
          console.error(
            `📝 Request validation failed - admin dashboard may expect different payload structure`
          );
          console.error(
            `🔍 Expected format: {"name": "string", "phone": "string", "username": "string"}`
          );
        } else if (response.status === 404) {
          console.error(
            `🔍 Endpoint not found - check admin dashboard URL and /api/external/customer-registration path`
          );
        } else if (response.status >= 500) {
          console.error(
            `💥 Admin dashboard server error - check admin dashboard server status`
          );
        }
        console.log(`🏢 =======================================\n`);
      }

      return success;
    } catch (error) {
      console.error(
        `\n💥 EXCEPTION: Error sending customer details to admin dashboard`
      );
      console.error(`👤 Customer: ${customer.name} (${customer.username})`);
      console.error(`📞 Phone: ${customer.phone}`);
      console.error(`🔥 Error:`, error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error(
          `🌐 Network error - check if admin dashboard URL is accessible`
        );
      }
      console.log(`🏢 =======================================\n`);
      return false;
    }
  }

  /**
   * Notify admin dashboard about KYC document submission
   * Sends notification when customer uploads KYC documents for review
   */
  async notifyKycSubmission(customer: User): Promise<boolean> {
    try {
      if (!this.adminDashboardUrl || !this.apiKey) {
        console.log(
          "⚠️  Admin dashboard integration not configured - skipping KYC submission notification"
        );
        return false;
      }

      // Prepare KYC submission notification payload
      const kycNotification = {
        type: "kyc_submission",
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        business_name: customer.businessName,
        kyc_status: customer.kycStatus,
        kyc_documents: customer.kycDocuments,
        submitted_at: new Date().toISOString(),
      };

      // Log KYC submission notification
      console.log(`\n📄 =======================================`);
      console.log(`🔔 NOTIFYING ADMIN ABOUT KYC SUBMISSION`);
      console.log(`📄 =======================================`);
      console.log(`👤 Customer: ${customer.name}`);
      console.log(`📧 Email: ${customer.email}`);
      console.log(`📞 Phone: ${customer.phone}`);
      console.log(`🏢 Business: ${customer.businessName || "Not provided"}`);
      console.log(`📋 KYC Status: ${customer.kycStatus}`);
      console.log(
        `📎 Documents: ${customer.kycDocuments ? "Uploaded" : "None"}`
      );
      console.log(
        `🔗 Admin URL: ${this.adminDashboardUrl}/api/external/kyc-submission`
      );

      // Send KYC submission notification to admin dashboard
      const response = await fetch(
        `${this.adminDashboardUrl}/api/external/kyc-submission`,
        {
          method: "POST",
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(kycNotification),
        }
      );

      const success = response.ok;

      if (success) {
        console.log(`✅ SUCCESS: Admin notified about KYC submission`);
        console.log(`👤 Customer: ${customer.name} (${customer.email})`);
        console.log(`📋 Status: ${customer.kycStatus}`);
        console.log(`📄 =======================================\n`);
      } else {
        console.error(`❌ FAILED: Admin KYC notification failed`);
        console.error(`🔥 Response: ${response.status} ${response.statusText}`);
        const errorText = await response.text().catch(() => "Unknown error");
        console.error(`📄 Error details:`, errorText);
        console.log(`📄 =======================================\n`);
      }

      return success;
    } catch (error) {
      console.error(`💥 EXCEPTION: Error sending KYC notification to admin`);
      console.error(`👤 Customer: ${customer.name}`);
      console.error(`🔥 Error:`, error);
      console.log(`📄 =======================================\n`);
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
        kycSubmission: `${this.adminDashboardUrl}/api/external/kyc-submission`,
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
