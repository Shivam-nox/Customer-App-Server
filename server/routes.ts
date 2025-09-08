import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { driverService } from "./driverService";
import { adminService } from "./adminService";
import { db } from "./db";
import { orders } from "@shared/schema";
import { eq } from "drizzle-orm";
import jsPDF from "jspdf";
import bcrypt from "bcryptjs";
import "./types";

// Validation schemas
const signupSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  businessName: z.string().min(1),
  businessAddress: z.string().min(1),
  industryType: z.string().min(1),
  gstNumber: z.string().min(15).max(15),
  panNumber: z.string().min(10).max(10),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const createOrderSchema = z.object({
  quantity: z.number().min(1),
  deliveryAddress: z.string().min(1),
  deliveryLatitude: z.number().optional(),
  deliveryLongitude: z.number().optional(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
});

const processPaymentSchema = z.object({
  orderId: z.string(),
  method: z.enum(["upi", "cards", "netbanking", "wallet", "cod"]),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    next();
  };

  // Authentication Routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = signupSchema.parse(req.body);

      // Check if username or email already exists
      const existingUser =
        (await storage.getUserByUsername(userData.username)) ||
        (await storage.getUserByEmail(userData.email));

      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Username or email already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Create user
      const newUser = await storage.createUser({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        passwordHash,
        businessName: userData.businessName,
        businessAddress: userData.businessAddress,
        industryType: userData.industryType,
        gstNumber: userData.gstNumber,
        panNumber: userData.panNumber,
        role: "customer",
      });

      // Notify admin dashboard about new customer registration
      console.log(`🚀 New customer registered: ${newUser.name} (${newUser.username || newUser.email})`);
      console.log(`📧 Attempting to notify admin dashboard about customer registration...`);
      
      const adminNotificationSuccess = await adminService.notifyCustomerRegistration(newUser);
      
      console.log(`📊 Admin dashboard notification result: ${adminNotificationSuccess ? 'SUCCESS' : 'FAILED'}`);
      
      if (adminNotificationSuccess) {
        console.log(`✅ Admin dashboard successfully notified about new customer: ${newUser.name}`);
      } else {
        console.log(`⚠️  Admin dashboard notification failed for customer: ${newUser.name} - user registration completed but admin was not notified`);
      }

      // Return user without password hash
      const { passwordHash: _, ...userResponse } = newUser;

      res.json({ 
        success: true, 
        user: userResponse,
        adminNotified: adminNotificationSuccess
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Check password
      if (!user.passwordHash) {
        return res
          .status(401)
          .json({ error: "Account not properly configured" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Return user without password hash
      const { passwordHash: _, ...userResponse } = user;

      res.json({
        success: true,
        user: userResponse,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Login failed" });
    }
  });

  // User profile routes
  app.get("/api/user/profile", requireAuth, async (req, res) => {
    res.json({ user: req.user! });
  });

  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.user!.id, updates);
      res.json({ user });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(400).json({ error: "Failed to update profile" });
    }
  });

  // KYC document upload
  app.post("/api/kyc/upload-url", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("KYC upload URL error:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/kyc/documents", requireAuth, async (req, res) => {
    try {
      const { documents } = req.body;
      const user = await storage.updateUser(req.user!.id, {
        kycDocuments: documents,
        kycStatus: "submitted",
      });

      // Create notification
      await storage.createNotification({
        userId: user.id,
        title: "KYC Documents Submitted",
        message:
          "Your KYC documents have been submitted for verification. You'll be notified once reviewed.",
        type: "kyc",
      });

      res.json({ user });
    } catch (error) {
      console.error("KYC documents error:", error);
      res.status(400).json({ error: "Failed to update KYC documents" });
    }
  });

  // Order routes
  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const orderData = createOrderSchema.parse(req.body);

      // Fetch dynamic pricing from system settings
      const ratePerLiterSetting =
        await storage.getSystemSetting("rate_per_liter");
      const deliveryChargesSetting =
        await storage.getSystemSetting("delivery_charges");
      const gstRateSetting = await storage.getSystemSetting("gst_rate");

      // Use dynamic values from system_settings, with fallbacks
      const ratePerLiter = parseFloat(ratePerLiterSetting?.value || "70.5");
      const deliveryCharges = parseFloat(
        deliveryChargesSetting?.value || "300",
      );
      const gstRate = parseFloat(gstRateSetting?.value || "0.18");

      // Calculate pricing with dynamic values
      const subtotal = orderData.quantity * ratePerLiter;
      const gst = deliveryCharges * gstRate;
      const totalAmount = subtotal + deliveryCharges + gst;

      console.log(`💰 Order pricing calculation using dynamic settings:`);
      console.log(
        `   • Rate per liter: ₹${ratePerLiter} (from system_settings)`,
      );
      console.log(
        `   • Delivery charges: ₹${deliveryCharges} (from system_settings)`,
      );
      console.log(
        `   • GST rate: ${(gstRate * 100).toFixed(1)}% (from system_settings)`,
      );
      console.log(`   • Quantity: ${orderData.quantity} liters`);
      console.log(`   • Subtotal: ₹${subtotal.toFixed(2)}`);
      console.log(`   • GST: ₹${gst.toFixed(2)}`);
      console.log(`   • Total: ₹${totalAmount.toFixed(2)}`);

      const order = await storage.createOrder({
        customerId: req.user!.id,
        quantity: orderData.quantity,
        ratePerLiter: ratePerLiter.toString(),
        subtotal: subtotal.toString(),
        deliveryCharges: deliveryCharges.toString(),
        gst: gst.toString(),
        totalAmount: totalAmount.toString(),
        deliveryAddress: orderData.deliveryAddress,
        deliveryLatitude: orderData.deliveryLatitude?.toString(),
        deliveryLongitude: orderData.deliveryLongitude?.toString(),
        scheduledDate: new Date(orderData.scheduledDate),
        scheduledTime: orderData.scheduledTime,
        status: "pending",
      });

      // Create notification
      await storage.createNotification({
        userId: req.user!.id,
        title: "Order Created",
        message: `Your order #${order.orderNumber} has been created successfully.`,
        type: "order_update",
        orderId: order.id,
      });

      // Notify driver app about the new order
      const notificationSuccess = await driverService.notifyNewOrder(
        order,
        req.user!,
      );

      res.json({
        order,
        driverNotified: notificationSuccess,
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(400).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const orders = await storage.getUserOrders(req.user!.id, limit);
      res.json({ orders });
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Failed to get orders" });
    }
  });

  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order || order.customerId !== req.user!.id) {
        return res.status(404).json({ error: "Order not found" });
      }

      const delivery = await storage.getDelivery(order.id);
      res.json({ order, delivery });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Failed to get order" });
    }
  });

  app.post("/api/notifications", requireAuth, async (req, res) => {
    console.log(
      `🔥 OTP GENERATION REQUEST - Order ID: 123456, User ID: ${req.user?.id}`,
    );

    try {
      const order = await storage.getOrder("123456");
      console.log(`📋 Order lookup result:`, {
        found: !!order,
        orderNumber: order?.orderNumber,
        status: order?.status,
        customerId: order?.customerId,
        requestUserId: req.user?.id,
        ownerMatch: order?.customerId === req.user?.id,
      });

      if (!order || order.customerId !== req.user!.id) {
        console.log(`❌ Order access denied - Order not found or unauthorized`);
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status !== "in_transit") {
        console.log(
          `❌ Invalid order status for OTP generation: ${order.status} (expected: in_transit)`,
        );
        return res.status(400).json({
          error:
            "OTP can only be generated for orders that are out for delivery",
        });
      }

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`🎲 Generated OTP: ${otp} for order ${order.orderNumber}`);

      const updatedOrder = await storage.updateOrderStatus(
        order.id,
        "in_transit",
      );

      // Manually update the OTP since the status didn't change
      await db
        .update(orders)
        .set({ deliveryOtp: otp })
        .where(eq(orders.id, order.id));
      console.log(`💾 OTP saved to database for order ${order.orderNumber}`);

      console.log(
        `🔐 Generated delivery OTP for order ${order.orderNumber}: ${otp}`,
      );

      // Send OTP to driver app via webhook
      console.log(`📤 Attempting to send OTP to driver app...`);
      const otpNotificationSuccess = await driverService.sendOtpToDriver(
        order.orderNumber,
        otp,
      );
      console.log(
        `📱 Driver notification result: ${otpNotificationSuccess ? "SUCCESS" : "FAILED"}`,
      );

      res.json({
        success: true,
        message: "Delivery OTP generated successfully",
        otp,
        driverNotified: otpNotificationSuccess,
      });
    } catch (error) {
      console.error("Generate OTP error:", error);
      res.status(500).json({ error: "Failed to generate delivery OTP" });
    }
  });

  // Payment routes
  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      const { orderId, method } = processPaymentSchema.parse(req.body);

      const order = await storage.getOrder(orderId);
      if (!order || order.customerId !== req.user!.id) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Handle COD differently from other payment methods
      if (method === "cod") {
        const payment = await storage.createPayment({
          orderId,
          customerId: req.user!.id,
          amount: order.totalAmount,
          method,
          status: "pending", // COD payments remain pending until delivery
        });

        // Immediately confirm the order for COD
        await storage.updateOrderStatus(orderId, "confirmed");

        // Create notifications for COD
        await storage.createNotification({
          userId: req.user!.id,
          title: "Order Confirmed (COD)",
          message: `Your order #${order.orderNumber} has been confirmed. Pay ₹${order.totalAmount} when delivered.`,
          type: "order_update",
          orderId,
        });

        res.json({
          payment,
          message: "Order confirmed with Cash on Delivery",
          orderStatus: "confirmed",
        });
      } else {
        const payment = await storage.createPayment({
          orderId,
          customerId: req.user!.id,
          amount: order.totalAmount,
          method,
          status: "processing",
        });

        // Simulate payment processing for other methods
        setTimeout(async () => {
          try {
            const transactionId = `TXN${Date.now()}`;
            await storage.updatePaymentStatus(
              payment.id,
              "completed",
              transactionId,
            );
            await storage.updateOrderStatus(orderId, "confirmed");

            // Create notifications
            await storage.createNotification({
              userId: req.user!.id,
              title: "Payment Successful",
              message: `Payment of ₹${order.totalAmount} completed successfully.`,
              type: "payment",
              orderId,
            });

            await storage.createNotification({
              userId: req.user!.id,
              title: "Order Confirmed",
              message: `Your order #${order.orderNumber} has been confirmed and assigned to a driver.`,
              type: "order_update",
              orderId,
            });
          } catch (error) {
            console.error("Payment processing error:", error);
          }
        }, 2000);

        res.json({ payment, message: "Payment processing initiated" });
      }
    } catch (error) {
      console.error("Process payment error:", error);
      res.status(400).json({ error: "Failed to process payment" });
    }
  });

  app.get("/api/payments/order/:orderId", requireAuth, async (req, res) => {
    try {
      const payment = await storage.getPaymentByOrder(req.params.orderId);
      if (!payment || payment.customerId !== req.user!.id) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json({ payment });
    } catch (error) {
      console.error("Get payment error:", error);
      res.status(500).json({ error: "Failed to get payment" });
    }
  });

  // Invoice generation
  app.get("/api/orders/:id/invoice", requireAuth, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order || order.customerId !== req.user!.id) {
        return res.status(404).json({ error: "Order not found" });
      }

      const payment = await storage.getPaymentByOrder(order.id);
      if (!payment || payment.status !== "completed") {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Generate PDF invoice
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text("ZAPYGO", 20, 20);
      doc.setFontSize(12);
      doc.text("Doorstep Diesel Delivery", 20, 30);

      // Invoice details
      doc.setFontSize(16);
      doc.text("INVOICE", 150, 20);
      doc.setFontSize(10);
      doc.text(`Invoice #: ${order.orderNumber}`, 150, 30);
      doc.text(
        `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
        150,
        38,
      );

      // Customer details
      doc.setFontSize(12);
      doc.text("Bill To:", 20, 60);
      doc.setFontSize(10);
      doc.text(req.user!.businessName || req.user!.name, 20, 70);
      doc.text(req.user!.phone || "", 20, 78);
      doc.text(req.user!.email || "", 20, 86);

      // Order details
      doc.text("Delivery Address:", 20, 100);
      doc.text(order.deliveryAddress, 20, 108);

      // Items table
      doc.line(20, 125, 190, 125);
      doc.text("Description", 25, 135);
      doc.text("Qty", 100, 135);
      doc.text("Rate", 130, 135);
      doc.text("Amount", 160, 135);
      doc.line(20, 140, 190, 140);

      doc.text("Diesel Fuel", 25, 150);
      doc.text(`${order.quantity}L`, 100, 150);
      doc.text(`₹${order.ratePerLiter}`, 130, 150);
      doc.text(`₹${order.subtotal}`, 160, 150);

      doc.text("Delivery Charges", 25, 160);
      doc.text("1", 100, 160);
      doc.text(`₹${order.deliveryCharges}`, 130, 160);
      doc.text(`₹${order.deliveryCharges}`, 160, 160);

      doc.text("GST (18%)", 25, 170);
      doc.text("-", 100, 170);
      doc.text("-", 130, 170);
      doc.text(`₹${order.gst}`, 160, 170);

      doc.line(20, 175, 190, 175);
      doc.setFontSize(12);
      doc.text("Total Amount:", 130, 185);
      doc.text(`₹${order.totalAmount}`, 160, 185);

      // Footer
      doc.setFontSize(8);
      doc.text("Thank you for choosing Zapygo!", 20, 250);
      doc.text(
        "For support, contact: support@zapygo.com | +91 1800-123-4567",
        20,
        260,
      );

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice-${order.orderNumber}.pdf`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Generate invoice error:", error);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      const unreadCount = await storage.getUnreadCount(req.user!.id);
      res.json({ notifications, unreadCount });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  app.put("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Driver Integration Routes

  // Test driver app connection
  app.get("/api/integration/driver/test", async (req, res) => {
    try {
      const connectionTest = await driverService.testConnection();
      const integrationInfo = await driverService.getIntegrationInfo();

      res.json({
        connected: connectionTest,
        // timestamp: new Date().toISOString(),
        // ...integrationInfo
      });
      console.log("Driver app timestamp testing done");
    } catch (error) {
      console.error("Driver integration test error:", error);
      res.status(500).json({ error: "Failed to test driver integration" });
    }
  });

  // Get driver integration info
  app.get("/api/integration/driver/info", async (req, res) => {
    try {
      const integrationInfo = await driverService.getIntegrationInfo();
      res.json(integrationInfo);
    } catch (error) {
      console.error("Driver integration info error:", error);
      res.status(500).json({ error: "Failed to get integration info" });
    }
  });

  // Debug endpoint to check API secrets
  app.get("/api/integration/driver/debug", async (req, res) => {
    try {
      const apiSecret = process.env.CUSTOMER_APP_KEY || "NOT_SET";
      const driverUrl = process.env.DRIVER_APP_URL || "NOT_SET";

      res.json({
        apiSecret:
          apiSecret.substring(0, 10) +
          "..." +
          (apiSecret.length > 10
            ? apiSecret.substring(apiSecret.length - 4)
            : ""),
        apiSecretLength: apiSecret.length,
        driverUrl: driverUrl,
        isApiSecretUrl: apiSecret.startsWith("http"),
        issue: apiSecret.startsWith("http")
          ? "API_SECRET_IS_URL_NOT_KEY"
          : null,
        suggestion: apiSecret.startsWith("http")
          ? "Update CUSTOMER_APP_KEY to be an API key, not a URL"
          : "Configuration looks correct",
        // timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Driver integration debug error:", error);
      res.status(500).json({ error: "Failed to get debug info" });
    }
  });

  // Update order status from driver app (for future use)
  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const { status, driverId } = req.body;

      // Validate status
      const validStatuses = [
        "pending",
        "confirmed",
        "fuel_loaded",
        "in_transit",
        "delivered",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const order = await storage.updateOrderStatus(
        req.params.id,
        status,
        driverId,
      );

      // Create notification for customer
      const customer = await storage.getUser(order.customerId);
      if (customer) {
        await storage.createNotification({
          userId: customer.id,
          title: "Order Status Updated",
          message: `Your order #${order.orderNumber} is now ${status.replace("_", " ")}`,
          type: "order_update",
          orderId: order.id,
        });
      }

      res.json({ order });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Mock driver location updates (for simulation)
  app.post("/api/orders/:id/update-driver-location", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const delivery = await storage.updateDriverLocation(
        req.params.id,
        latitude,
        longitude,
      );
      res.json({ delivery });
    } catch (error) {
      console.error("Update driver location error:", error);
      res.status(500).json({ error: "Failed to update driver location" });
    }
  });

  // Serve KYC documents
  app.get("/api/kyc-documents/:filePath(*)", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(
        `/objects/${req.params.filePath}`,
      );

      // Check if user owns this document (basic security)
      // In production, implement proper ACL checking

      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Get KYC document error:", error);
      res.status(404).json({ error: "Document not found" });
    }
  });

  // Saved Addresses routes
  app.get("/api/addresses", requireAuth, async (req, res) => {
    try {
      const addresses = await storage.getUserSavedAddresses(req.user!.id);
      res.json({ addresses });
    } catch (error) {
      console.error("Get addresses error:", error);
      res.status(500).json({ error: "Failed to get addresses" });
    }
  });

  app.post("/api/addresses", requireAuth, async (req, res) => {
    try {
      const addressData = {
        ...req.body,
        userId: req.user!.id,
      };

      // Validate pincode for Bangalore area
      if (!req.body.pincode?.match(/^5[0-9]{5}$/)) {
        return res.status(400).json({ error: "Invalid Bangalore pincode" });
      }

      const address = await storage.createSavedAddress(addressData);
      res.json({ address });
    } catch (error) {
      console.error("Create address error:", error);
      res.status(400).json({ error: "Failed to create address" });
    }
  });

  app.put("/api/addresses/:id", requireAuth, async (req, res) => {
    try {
      const address = await storage.getSavedAddress(req.params.id);
      if (!address || address.userId !== req.user!.id) {
        return res.status(404).json({ error: "Address not found" });
      }

      const updatedAddress = await storage.updateSavedAddress(
        req.params.id,
        req.body,
      );
      res.json({ address: updatedAddress });
    } catch (error) {
      console.error("Update address error:", error);
      res.status(400).json({ error: "Failed to update address" });
    }
  });

  app.delete("/api/addresses/:id", requireAuth, async (req, res) => {
    try {
      const address = await storage.getSavedAddress(req.params.id);
      if (!address || address.userId !== req.user!.id) {
        return res.status(404).json({ error: "Address not found" });
      }

      await storage.deleteSavedAddress(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete address error:", error);
      res.status(400).json({ error: "Failed to delete address" });
    }
  });

  app.put("/api/addresses/:id/default", requireAuth, async (req, res) => {
    try {
      const address = await storage.getSavedAddress(req.params.id);
      if (!address || address.userId !== req.user!.id) {
        return res.status(404).json({ error: "Address not found" });
      }

      await storage.setDefaultAddress(req.user!.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Set default address error:", error);
      res.status(400).json({ error: "Failed to set default address" });
    }
  });

  // System Settings routes (Admin only)
  const requireAdmin = async (req: any, res: any, next: any) => {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.user = user;
    next();
  };

  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      res.json({ settings });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  app.get("/api/settings/category/:category", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSystemSettingsByCategory(
        req.params.category,
      );
      res.json({ settings });
    } catch (error) {
      console.error("Get settings by category error:", error);
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  app.get("/api/settings/:key", requireAuth, async (req, res) => {
    try {
      const setting = await storage.getSystemSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json({ setting });
    } catch (error) {
      console.error("Get setting error:", error);
      res.status(500).json({ error: "Failed to get setting" });
    }
  });

  app.put("/api/settings/:key", requireAdmin, async (req, res) => {
    try {
      const { value } = req.body;
      if (!value) {
        return res.status(400).json({ error: "Value is required" });
      }

      const setting = await storage.updateSystemSetting(
        req.params.key,
        value,
        req.user!.id,
      );
      res.json({ setting });
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(400).json({ error: "Failed to update setting" });
    }
  });

  app.post("/api/settings", requireAdmin, async (req, res) => {
    try {
      const settingData = {
        ...req.body,
        updatedBy: req.user!.id,
      };

      const setting = await storage.createSystemSetting(settingData);
      res.json({ setting });
    } catch (error) {
      console.error("Create setting error:", error);
      res.status(400).json({ error: "Failed to create setting" });
    }
  });

  // Webhook middleware for driver app authentication
  const requireDriverAuth = async (req: any, res: any, next: any) => {
    const apiSecret = req.headers["x-api-secret"];
    const expectedSecret = process.env.CUSTOMER_APP_KEY;

    if (!apiSecret || !expectedSecret) {
      return res.status(401).json({ error: "API secret required" });
    }

    if (apiSecret !== expectedSecret) {
      return res.status(401).json({ error: "Invalid API secret" });
    }

    next();
  };

  // Webhook Routes for Driver App Integration
  const deliveryStatusSchema = z.object({
    orderId: z.string().min(1),
    status: z.enum(["confirmed", "in_transit", "delivered"]),
    driverId: z.string().min(1).optional(),
    timestamp: z.string().optional(),
  });

  app.post(
    "/api/webhooks/delivery-status",
    requireDriverAuth,
    async (req, res) => {
      try {
        const statusUpdate = deliveryStatusSchema.parse(req.body);

        console.log(
          `📦 Received delivery status update from driver app:`,
          statusUpdate,
        );

        // Update order status in database
        const updatedOrder = await storage.updateOrderStatus(
          statusUpdate.orderId,
          statusUpdate.status,
          statusUpdate.driverId,
        );

        console.log(
          `✅ Order ${statusUpdate.orderId} status updated to: ${statusUpdate.status}`,
        );

        // If order is now in_transit and has OTP, send it to driver app
        if (statusUpdate.status === "in_transit" && updatedOrder.deliveryOtp) {
          console.log(
            `📤 Order transitioned to in_transit - sending OTP to driver app`,
          );
          console.log(
            `🔐 Auto-generated OTP: ${updatedOrder.deliveryOtp} for order: ${updatedOrder.orderNumber}`,
          );

          const otpNotificationSuccess = await driverService.sendOtpToDriver(
            updatedOrder.orderNumber,
            updatedOrder.deliveryOtp,
          );

          console.log(
            `📱 Driver OTP notification result: ${otpNotificationSuccess ? "SUCCESS" : "FAILED"}`,
          );
        }

        // // Create notification for customer
        // await storage.createNotification({
        //   userId: updatedOrder.customerId,
        //   title: "Order Status Updated",
        //   message: `Your order ${updatedOrder.orderNumber} is now ${statusUpdate.status.replace('_', ' ')}`,
        //   type: "order_update",
        //   orderId: updatedOrder.id,
        // });

        res.json({
          success: true,
          order: updatedOrder,
          message: "Status updated successfully",
        });
      } catch (error) {
        console.error("Webhook delivery status error:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: "Invalid payload",
            details: error.errors,
          });
        }
        res.status(500).json({ error: "Failed to update delivery status" });
      }
    },
  );

  // Test endpoint for driver app to verify webhook connectivity
  app.post("/api/webhooks/test", requireDriverAuth, async (req, res) => {
    res.json({
      success: true,
      message: "Webhook connection successful",
      timestamp: new Date().toISOString(),
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
