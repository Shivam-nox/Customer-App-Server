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
    // For local development: Set ADMIN_DASHBOARD_URL in .env
    // For production: Use the Replit URL or your deployed admin dashboard URL
    this.adminDashboardUrl =
      process.env.ADMIN_DASHBOARD_URL || "http://localhost:3002"; // Default to local admin dashboard
    this.apiKey = process.env.ADMIN_API_KEY || "zapygo-admin-2025-secure-key";

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
   * Notify admin dashboard about new order creation
   */
  async notifyNewOrder(order: any, customer: any): Promise<boolean> {
    try {
      if (!this.adminDashboardUrl || !this.apiKey) {
        console.log(
          "⚠️  Admin dashboard not configured - skipping new order notification"
        );
        return false;
      }

      const orderNotification = {
        type: "new_order",
        order_id: order.id,
        order_number: order.orderNumber,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        business_name: customer.businessName,
        quantity: order.quantity,
        total_amount: order.totalAmount,
        delivery_address: order.deliveryAddress,
        scheduled_date: order.scheduledDate.toISOString(),
        scheduled_time: order.scheduledTime,
        status: order.status,
        created_at: new Date().toISOString(),
      };

      console.log(`\n📦 =======================================`);
      console.log(`🔔 NOTIFYING ADMIN ABOUT NEW ORDER`);
      console.log(`📦 =======================================`);
      console.log(`📋 Order: ${order.orderNumber}`);
      console.log(`👤 Customer: ${customer.name}`);
      console.log(`💰 Amount: ₹${order.totalAmount}`);
      console.log(`⛽ Quantity: ${order.quantity}L`);

      const response = await fetch(
        `${this.adminDashboardUrl}/api/external/new-order`,
        {
          method: "POST",
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderNotification),
        }
      );

      const success = response.ok;

      if (success) {
        console.log(`✅ SUCCESS: Admin notified about new order`);
      } else {
        console.error(`❌ FAILED: Admin order notification failed`);
        console.error(`🔥 Response: ${response.status} ${response.statusText}`);
      }
      console.log(`📦 =======================================\n`);

      return success;
    } catch (error) {
      console.error(`💥 EXCEPTION: Error sending order notification to admin`);
      console.error(`🔥 Error:`, error);
      console.log(`📦 =======================================\n`);
      return false;
    }
  }

  /**
   * Notify admin dashboard about payment completion
   */
  async notifyPaymentCompleted(
    order: any,
    payment: any,
    customer: any
  ): Promise<boolean> {
    try {
      if (!this.adminDashboardUrl || !this.apiKey) {
        console.log(
          "⚠️  Admin dashboard not configured - skipping payment notification"
        );
        return false;
      }

      const paymentNotification = {
        type: "payment_completed",
        payment_id: payment.id,
        order_id: order.id,
        order_number: order.orderNumber,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        amount: payment.amount,
        payment_method: payment.method,
        transaction_id: payment.transactionId,
        status: payment.status,
        completed_at: new Date().toISOString(),
      };

      console.log(`\n💳 =======================================`);
      console.log(`🔔 NOTIFYING ADMIN ABOUT PAYMENT`);
      console.log(`💳 =======================================`);
      console.log(`📋 Order: ${order.orderNumber}`);
      console.log(`💰 Amount: ₹${payment.amount}`);
      console.log(`💳 Method: ${payment.method}`);

      const response = await fetch(
        `${this.adminDashboardUrl}/api/external/payment-completed`,
        {
          method: "POST",
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentNotification),
        }
      );

      const success = response.ok;

      if (success) {
        console.log(`✅ SUCCESS: Admin notified about payment`);
      } else {
        console.error(`❌ FAILED: Admin payment notification failed`);
        console.error(`🔥 Response: ${response.status} ${response.statusText}`);
      }
      console.log(`💳 =======================================\n`);

      return success;
    } catch (error) {
      console.error(
        `💥 EXCEPTION: Error sending payment notification to admin`
      );
      console.error(`🔥 Error:`, error);
      console.log(`💳 =======================================\n`);
      return false;
    }
  }

  /**
   * Notify admin dashboard about payment failure
   */
  async notifyPaymentFailed(
    order: any,
    payment: any,
    customer: any,
    reason: string
  ): Promise<boolean> {
    try {
      if (!this.adminDashboardUrl || !this.apiKey) {
        console.log(
          "⚠️  Admin dashboard not configured - skipping payment failure notification"
        );
        return false;
      }

      const failureNotification = {
        type: "payment_failed",
        payment_id: payment.id,
        order_id: order.id,
        order_number: order.orderNumber,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        amount: payment.amount,
        payment_method: payment.method,
        failure_reason: reason,
        failed_at: new Date().toISOString(),
      };

      console.log(`\n❌ =======================================`);
      console.log(`🔔 NOTIFYING ADMIN ABOUT PAYMENT FAILURE`);
      console.log(`❌ =======================================`);
      console.log(`📋 Order: ${order.orderNumber}`);
      console.log(`💰 Amount: ₹${payment.amount}`);
      console.log(`⚠️  Reason: ${reason}`);

      const response = await fetch(
        `${this.adminDashboardUrl}/api/external/payment-failed`,
        {
          method: "POST",
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(failureNotification),
        }
      );

      const success = response.ok;

      if (success) {
        console.log(`✅ SUCCESS: Admin notified about payment failure`);
      } else {
        console.error(`❌ FAILED: Admin payment failure notification failed`);
        console.error(`🔥 Response: ${response.status} ${response.statusText}`);
      }
      console.log(`❌ =======================================\n`);

      return success;
    } catch (error) {
      console.error(
        `💥 EXCEPTION: Error sending payment failure notification to admin`
      );
      console.error(`🔥 Error:`, error);
      console.log(`❌ =======================================\n`);
      return false;
    }
  }

  /**
   * Notify admin dashboard about order cancellation
   */
  async notifyOrderCancelled(
    order: any,
    customer: any,
    reason: string
  ): Promise<boolean> {
    try {
      if (!this.adminDashboardUrl || !this.apiKey) {
        console.log(
          "⚠️  Admin dashboard not configured - skipping order cancellation notification"
        );
        return false;
      }

      const cancellationNotification = {
        type: "order_cancelled",
        order_id: order.id,
        order_number: order.orderNumber,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        business_name: customer.businessName,
        total_amount: order.totalAmount,
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      };

      console.log(`\n🚫 =======================================`);
      console.log(`🔔 NOTIFYING ADMIN ABOUT ORDER CANCELLATION`);
      console.log(`🚫 =======================================`);
      console.log(`📋 Order: ${order.orderNumber}`);
      console.log(`👤 Customer: ${customer.name}`);
      console.log(`⚠️  Reason: ${reason}`);

      const response = await fetch(
        `${this.adminDashboardUrl}/api/external/order-cancelled`,
        {
          method: "POST",
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cancellationNotification),
        }
      );

      const success = response.ok;

      if (success) {
        console.log(`✅ SUCCESS: Admin notified about order cancellation`);
      } else {
        console.error(`❌ FAILED: Admin cancellation notification failed`);
        console.error(`🔥 Response: ${response.status} ${response.statusText}`);
      }
        console.log(`🚫 =======================================\n`);

      return success;
    } catch (error) {
      console.error(
        `💥 EXCEPTION: Error sending cancellation notification to admin`
      );
      console.error(`🔥 Error:`, error);
      console.log(`🚫 =======================================\n`);
      return false;
    }
  }

  /**
   * Notify admin dashboard about high-value orders (above threshold)
   */
  async notifyHighValueOrder(
    order: any,
    customer: any,
    threshold: number = 50000
  ): Promise<boolean> {
    try {
      const orderAmount = parseFloat(order.totalAmount);

      if (orderAmount < threshold) {
        return false; // Not a high-value order
      }

      if (!this.adminDashboardUrl || !this.apiKey) {
        console.log(
          "⚠️  Admin dashboard not configured - skipping high-value order notification"
        );
        return false;
      }

      const highValueNotification = {
        type: "high_value_order",
        order_id: order.id,
        order_number: order.orderNumber,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        business_name: customer.businessName,
        total_amount: order.totalAmount,
        quantity: order.quantity,
        threshold: threshold,
        created_at: new Date().toISOString(),
      };

      console.log(`\n💎 =======================================`);
      console.log(`🔔 NOTIFYING ADMIN ABOUT HIGH-VALUE ORDER`);
      console.log(`💎 =======================================`);
      console.log(`📋 Order: ${order.orderNumber}`);
      console.log(`👤 Customer: ${customer.name}`);
      console.log(
        `💰 Amount: ₹${order.totalAmount} (Threshold: ₹${threshold})`
      );

      const response = await fetch(
        `${this.adminDashboardUrl}/api/external/high-value-order`,
        {
          method: "POST",
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(highValueNotification),
        }
      );

      const success = response.ok;

      if (success) {
        console.log(`✅ SUCCESS: Admin notified about high-value order`);
      } else {
        console.error(`❌ FAILED: Admin high-value order notification failed`);
        console.error(`🔥 Response: ${response.status} ${response.statusText}`);
      }
      console.log(`💎 =======================================\n`);

      return success;
    } catch (error) {
      console.error(
        `💥 EXCEPTION: Error sending high-value order notification to admin`
      );
      console.error(`🔥 Error:`, error);
      console.log(`💎 =======================================\n`);
      return false;
    }
  }

  /**
   * Notify admin dashboard about order status changes
   */
  async notifyOrderStatusChange(
    order: any,
    customer: any,
    oldStatus: string,
    newStatus: string
  ): Promise<boolean> {
    try {
      if (!this.adminDashboardUrl || !this.apiKey) {
        console.log(
          "⚠️  Admin dashboard not configured - skipping status change notification"
        );
        return false;
      }

      const statusChangeNotification = {
        type: "order_status_change",
        order_id: order.id,
        order_number: order.orderNumber,
        customer_id: customer.id,
        customer_name: customer.name,
        old_status: oldStatus,
        new_status: newStatus,
        driver_id: order.driverId,
        updated_at: new Date().toISOString(),
      };

      console.log(`\n🔄 =======================================`);
      console.log(`🔔 NOTIFYING ADMIN ABOUT STATUS CHANGE`);
      console.log(`🔄 =======================================`);
      console.log(`📋 Order: ${order.orderNumber}`);
      console.log(`🔄 Status: ${oldStatus} → ${newStatus}`);

      const response = await fetch(
        `${this.adminDashboardUrl}/api/external/order-status-change`,
        {
          method: "POST",
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(statusChangeNotification),
        }
      );

      const success = response.ok;

      if (success) {
        console.log(`✅ SUCCESS: Admin notified about status change`);
      } else {
        console.error(`❌ FAILED: Admin status change notification failed`);
        console.error(`🔥 Response: ${response.status} ${response.statusText}`);
      }
      console.log(`🔄 =======================================\n`);

      return success;
    } catch (error) {
      console.error(
        `💥 EXCEPTION: Error sending status change notification to admin`
      );
      console.error(`🔥 Error:`, error);
      console.log(`🔄 =======================================\n`);
      return false;
    }
  }

  /**
   * Notify admin dashboard about system errors
   */
  async notifySystemError(
    errorType: string,
    errorMessage: string,
    context: any
  ): Promise<boolean> {
    try {
      if (!this.adminDashboardUrl || !this.apiKey) {
        console.log(
          "⚠️  Admin dashboard not configured - skipping system error notification"
        );
        return false;
      }

      const errorNotification = {
        type: "system_error",
        error_type: errorType,
        error_message: errorMessage,
        context: context,
        occurred_at: new Date().toISOString(),
      };

      console.log(`\n⚠️  =======================================`);
      console.log(`🔔 NOTIFYING ADMIN ABOUT SYSTEM ERROR`);
      console.log(`⚠️  =======================================`);
      console.log(`🔥 Error Type: ${errorType}`);
      console.log(`📝 Message: ${errorMessage}`);

      const response = await fetch(
        `${this.adminDashboardUrl}/api/external/system-error`,
        {
          method: "POST",
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(errorNotification),
        }
      );

      const success = response.ok;

      if (success) {
        console.log(`✅ SUCCESS: Admin notified about system error`);
      } else {
        console.error(`❌ FAILED: Admin system error notification failed`);
        console.error(`🔥 Response: ${response.status} ${response.statusText}`);
      }
      console.log(`⚠️  =======================================\n`);

      return success;
    } catch (error) {
      console.error(
        `💥 EXCEPTION: Error sending system error notification to admin`
      );
      console.error(`🔥 Error:`, error);
      console.log(`⚠️  =======================================\n`);
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
        newOrder: `${this.adminDashboardUrl}/api/external/new-order`,
        paymentCompleted: `${this.adminDashboardUrl}/api/external/payment-completed`,
        paymentFailed: `${this.adminDashboardUrl}/api/external/payment-failed`,
        orderCancelled: `${this.adminDashboardUrl}/api/external/order-cancelled`,
        highValueOrder: `${this.adminDashboardUrl}/api/external/high-value-order`,
        orderStatusChange: `${this.adminDashboardUrl}/api/external/order-status-change`,
        systemError: `${this.adminDashboardUrl}/api/external/system-error`,
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
