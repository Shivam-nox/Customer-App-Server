import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { driverService } from "./driverService";
import { adminService } from "./adminService";
import { razorpayService } from "./razorpayService";
import { db } from "./db";
import { orders } from "@shared/schema";
import { eq } from "drizzle-orm";
import { jsPDF } from "jspdf";
import bcrypt from "bcryptjs";
import "./types";

// Validation schemas
// SIMPLIFIED SIGNUP - Business fields made optional for easier onboarding
// TODO: Can be required later or collected via profile completion
const signupSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  
  // COMMENTED OUT - Business fields (optional for now, can be added later)
  // businessName: z.string().min(1),
  // businessAddress: z.string().min(1),
  // industryType: z.string().min(1),
  // gstNumber: z.string().min(15).max(15),
  // panNumber: z.string().min(10).max(10),
  // cinNumber: z
  //   .string()
  //   .optional()
  //   .refine(
  //     (val) =>
  //       !val || /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(val),
  //     "Invalid CIN format"
  //   ),
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
  scheduledTime: z
    .string()
    .regex(
      /^(09|11|13|15|17|19):00$/,
      "Invalid time slot. Must be one of: 09:00, 11:00, 13:00, 15:00, 17:00, 19:00"
    ),
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

      // Create user - business fields set to null for simplified signup
      const newUser = await storage.createUser({
        name: userData.name,
        username: userData.username,
        email: userData.email.toLowerCase(), // Normalize email to lowercase
        phone: userData.phone,
        passwordHash,
        // COMMENTED OUT - Business fields (can be added later via profile update)
        businessName: null, // userData.businessName,
        businessAddress: null, // userData.businessAddress,
        industryType: null, // userData.industryType,
        gstNumber: null, // userData.gstNumber,
        panNumber: null, // userData.panNumber,
        cinNumber: null, // userData.cinNumber,
        role: "customer",
      });

      // Notify admin dashboard about new customer registration
      console.log(
        `🚀 New customer registered: ${newUser.name} (${
          newUser.username || newUser.email
        })`
      );
      console.log(
        `📧 Attempting to notify admin dashboard about customer registration...`
      );

      const adminNotificationSuccess =
        await adminService.notifyCustomerRegistration(newUser);

      console.log(
        `📊 Admin dashboard notification result: ${
          adminNotificationSuccess ? "SUCCESS" : "FAILED"
        }`
      );

      if (adminNotificationSuccess) {
        console.log(
          `✅ Admin dashboard successfully notified about new customer: ${newUser.name}`
        );
      } else {
        console.log(
          `⚠️  Admin dashboard notification failed for customer: ${newUser.name} - user registration completed but admin was not notified`
        );
      }

      // Return user without password hash
      const { passwordHash: _, ...userResponse } = newUser;

      res.json({
        success: true,
        user: userResponse,
        adminNotified: adminNotificationSuccess,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      console.log(`🔐 Login attempt with: "${username}"`);

      // Try to get user by username first, then by email
      let user = await storage.getUserByUsername(username);
      console.log(`👤 User found by username: ${user ? 'YES' : 'NO'}`);
      
      // If not found by username, try email
      if (!user) {
        user = await storage.getUserByEmail(username);
        console.log(`📧 User found by email: ${user ? 'YES' : 'NO'}`);
      }
      
      if (!user) {
        console.log(`❌ No user found for: "${username}"`);
        return res.status(401).json({ error: "Invalid email/username or password" });
      }
      
      console.log(`✅ User found: ${user.name} (${user.email})`);


      // Check password
      if (!user.passwordHash) {
        return res
          .status(401)
          .json({ error: "Account not properly configured" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email/username or password" });
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

      // Validate email format if provided
      if (updates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updates.email)) {
          return res
            .status(400)
            .json({ error: "Please enter a valid email address" });
        }

        // Check if email is already taken by another user
        const existingUser = await storage.getUserByEmail(updates.email);
        if (existingUser && existingUser.id !== req.user!.id) {
          return res
            .status(400)
            .json({ error: "Email address is already registered" });
        }
      }

      // Validate phone format if provided
      if (updates.phone) {
        const phoneRegex = /^[+]?[0-9\s\-()]{10,15}$/;
        if (!phoneRegex.test(updates.phone)) {
          return res
            .status(400)
            .json({ error: "Please enter a valid phone number" });
        }

        // Check if phone is already taken by another user
        const existingUser = await storage.getUserByPhone(updates.phone);
        if (existingUser && existingUser.id !== req.user!.id) {
          return res
            .status(400)
            .json({ error: "Phone number is already registered" });
        }
      }

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

      // Create notification for customer
      await storage.createNotification({
        userId: user.id,
        title: "KYC Documents Submitted",
        message:
          "Your KYC documents have been submitted for verification. You'll be notified once reviewed.",
        type: "kyc",
      });

      // Notify admin dashboard about KYC submission
      console.log(`📄 KYC documents submitted by ${user.name} (${user.email})`);
      console.log(`📧 Attempting to notify admin dashboard...`);
      
      const adminNotificationSuccess = await adminService.notifyKycSubmission(user);
      
      if (adminNotificationSuccess) {
        console.log(`✅ Admin dashboard successfully notified about KYC submission`);
      } else {
        console.log(`⚠️  Admin dashboard notification failed - KYC submission recorded but admin was not notified`);
      }

      // Get all admin users to send in-app notifications
      const adminUsers = await storage.getAdminUsers();
      
      // Create in-app notifications for all admin users
      for (const admin of adminUsers) {
        await storage.createNotification({
          userId: admin.id,
          title: "New KYC Submission",
          message: `${user.name} (${user.businessName || 'No business name'}) has submitted KYC documents for review.`,
          type: "kyc",
        });
      }
      
      console.log(`📬 Created in-app notifications for ${adminUsers.length} admin user(s)`);

      res.json({ 
        user,
        adminNotified: adminNotificationSuccess,
        adminUsersNotified: adminUsers.length,
      });
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
      const ratePerLiterSetting = await storage.getSystemSetting(
        "rate_per_liter"
      );
      const deliveryChargesSetting = await storage.getSystemSetting(
        "delivery_charges"
      );
      const gstRateSetting = await storage.getSystemSetting("gst_rate");

      // Use dynamic values from system_settings, with fallbacks
      const ratePerLiter = parseFloat(ratePerLiterSetting?.value || "70.5");
      const deliveryCharges = parseFloat(
        deliveryChargesSetting?.value || "300"
      );
      const gstRate = parseFloat(gstRateSetting?.value || "0.18");

      // Calculate pricing with dynamic values
      const subtotal = orderData.quantity * ratePerLiter;
      const gst = deliveryCharges * gstRate;
      const totalAmount = subtotal + deliveryCharges + gst;

      console.log(`💰 Order pricing calculation using dynamic settings:`);
      console.log(
        `   • Rate per liter: ₹${ratePerLiter} (from system_settings)`
      );
      console.log(
        `   • Delivery charges: ₹${deliveryCharges} (from system_settings)`
      );
      console.log(
        `   • GST rate: ${(gstRate * 100).toFixed(1)}% (from system_settings)`
      );
      console.log(`   • Quantity: ${orderData.quantity} liters`);
      console.log(`   • Subtotal: ₹${subtotal.toFixed(2)}`);
      console.log(`   • GST: ₹${gst.toFixed(2)}`);
      console.log(`   • Total: ₹${totalAmount.toFixed(2)}`);
      console.log(
        `📅 Delivery scheduled for: ${orderData.scheduledDate} at ${orderData.scheduledTime}`
      );

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
      const driverNotificationSuccess = await driverService.notifyNewOrder(
        order,
        req.user!
      );

      // Notify admin dashboard about the new order (external webhook only - like customer registration)
      const adminNotificationSuccess = await adminService.notifyNewOrder(
        order,
        req.user!
      );

      // Check if this is a high-value order and notify admin
      await adminService.notifyHighValueOrder(
        order,
        req.user!,
        50000 // Threshold: ₹50,000
      );

      res.json({
        order,
        driverNotified: driverNotificationSuccess,
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

      // If order has a driver assigned, fetch driver details from drivers table
      let delivery = null;
      if (order.driverId) {
        const driver = await storage.getDriver(order.driverId);
        if (driver) {
          delivery = {
            id: `delivery-${order.id}`,
            orderId: order.id,
            driverId: driver.id,
            driverName: driver.name,
            driverPhone: driver.phone,
            driverEmail: driver.email || null,
            driverRating: parseFloat(driver.rating) || 0,
            vehicleNumber: "KA-05-HE-1234", // TODO: Get from vehicle assignment
            emergencyContact: {
              name: driver.emergencyContactName,
              phone: driver.emergencyContactPhone,
            },
            totalDeliveries: driver.totalDeliveries,
            currentLatitude: driver.currentLocation
              ? JSON.parse(driver.currentLocation as string)?.lat
              : null,
            currentLongitude: driver.currentLocation
              ? JSON.parse(driver.currentLocation as string)?.lng
              : null,
            status: driver.status,
            proofOfDelivery: null,
            deliveredAt: null,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          };
        }
      }

      res.json({ order, delivery });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Failed to get order" });
    }
  });

  // Cancel order route
  app.post("/api/orders/:id/cancel", requireAuth, async (req, res) => {
    try {
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ error: "Cancellation reason is required" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order || order.customerId !== req.user!.id) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Only allow cancellation for pending or confirmed orders
      if (!["pending", "confirmed"].includes(order.status)) {
        return res.status(400).json({ 
          error: `Cannot cancel order with status: ${order.status}. Only pending or confirmed orders can be cancelled.` 
        });
      }

      // Update order status to cancelled
      const cancelledOrder = await storage.updateOrderStatus(order.id, "cancelled");

      // Create notification for customer
      await storage.createNotification({
        userId: req.user!.id,
        title: "Order Cancelled",
        message: `Your order #${order.orderNumber} has been cancelled. Reason: ${reason}`,
        type: "order_update",
        orderId: order.id,
      });

      // Notify admin dashboard about cancellation (external webhook only)
      await adminService.notifyOrderCancelled(
        order,
        req.user!,
        reason
      );

      console.log(`🚫 Order ${order.orderNumber} cancelled by customer. Reason: ${reason}`);

      res.json({
        success: true,
        order: cancelledOrder,
      });
    } catch (error) {
      console.error("Cancel order error:", error);
      res.status(500).json({ error: "Failed to cancel order" });
    }
  });

  app.post(`/api/orders/:id/generate-otp`, requireAuth, async (req, res) => {
    console.log(
      `🔥 OTP GENERATION REQUEST - Order ID: 123456, User ID: ${req.user?.id}`
    );

    try {
      const order = await storage.getOrder(req.params.id);
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
          `❌ Invalid order status for OTP generation: ${order.status} (expected: in_transit)`
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
        "in_transit"
      );

      // Manually update the OTP since the status didn't change
      await db
        .update(orders)
        .set({ deliveryOtp: otp })
        .where(eq(orders.id, order.id));
      console.log(`💾 OTP saved to database for order ${order.orderNumber}`);

      console.log(
        `🔐 Generated delivery OTP for order ${order.orderNumber}: ${otp}`
      );

      // Send OTP to driver app via webhook
      console.log(`📤 Attempting to send OTP to driver app...`);
      const otpNotificationSuccess = await driverService.sendOtpToDriver(
        order.orderNumber,
        otp
      );
      console.log(
        `📱 Driver notification result: ${
          otpNotificationSuccess ? "SUCCESS" : "FAILED"
        }`
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

        // Keep order as pending - will be confirmed when driver accepts
        // COD orders follow the same flow: pending -> confirmed (driver accepts) -> in_transit -> delivered

        // Create notifications for COD
        await storage.createNotification({
          userId: req.user!.id,
          title: "Order Placed (COD)",
          message: `Your order #${order.orderNumber} has been placed. We're finding a driver for you. Pay ₹${order.totalAmount} when delivered.`,
          type: "order_update",
          orderId,
        });

        // Notify admin dashboard about COD payment (external webhook only)
        await adminService.notifyPaymentCompleted(
          order,
          payment,
          req.user!
        );

        res.json({
          payment,
          message: "Order placed with Cash on Delivery",
          orderStatus: "pending", // Order remains pending until driver accepts
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
              transactionId
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

  // Razorpay test endpoint
  app.get("/api/payments/razorpay/test", requireAuth, async (req, res) => {
    try {
      console.log("🧪 Testing Razorpay configuration...");

      // Test creating a small order
      const testOrder = await razorpayService.createOrder(
        1,
        "INR",
        "test_order"
      );

      res.json({
        success: true,
        message: "Razorpay is configured correctly",
        testOrderId: testOrder.id,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("❌ Razorpay test failed:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Razorpay test failed",
      });
    }
  });

  // Razorpay payment routes
  app.post(
    "/api/payments/razorpay/create-order",
    requireAuth,
    async (req, res) => {
      try {
        const { orderId } = req.body;

        if (!orderId) {
          return res.status(400).json({ error: "Order ID is required" });
        }

        const order = await storage.getOrder(orderId);
        if (!order || order.customerId !== req.user!.id) {
          return res.status(404).json({ error: "Order not found" });
        }

        // Create Razorpay order
        const razorpayOrder = await razorpayService.createOrder(
          parseFloat(order.totalAmount),
          "INR",
          `order_${order.orderNumber}`
        );

        console.log(`💳 Razorpay order created:`, {
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          razorpayOrderId: razorpayOrder.id,
        });

        res.json({
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
          orderDetails: {
            id: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
          },
        });
      } catch (error) {
        console.error("Razorpay order creation error:", error);
        res.status(500).json({ error: "Failed to create payment order" });
      }
    }
  );

  app.post("/api/payments/razorpay/verify", requireAuth, async (req, res) => {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } =
        req.body;

      if (
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature ||
        !orderId
      ) {
        return res
          .status(400)
          .json({ error: "Missing required payment verification data" });
      }

      // Verify signature
      const isValidSignature = razorpayService.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!isValidSignature) {
        console.error(`❌ Invalid Razorpay signature for order ${orderId}`);
        return res.status(400).json({ error: "Invalid payment signature" });
      }

      // Get order details
      const order = await storage.getOrder(orderId);
      if (!order || order.customerId !== req.user!.id) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Get payment details from Razorpay
      const paymentDetails = await razorpayService.getPaymentDetails(
        razorpayPaymentId
      );

      // Create payment record in database
      const payment = await storage.createPayment({
        orderId: order.id,
        customerId: req.user!.id,
        amount: order.totalAmount,
        method: (paymentDetails.method === "upi" || 
                paymentDetails.method === "cards" || 
                paymentDetails.method === "netbanking" || 
                paymentDetails.method === "wallet") 
                ? paymentDetails.method 
                : "cards", // Default fallback
        status: "completed",
        transactionId: razorpayPaymentId,
        gatewayResponse: {
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          paymentDetails,
        },
      });

      // Keep order status as pending - it will be confirmed when driver accepts
      // Order status should only change to "confirmed" when driver accepts the order

      // Create notifications
      await storage.createNotification({
        userId: req.user!.id,
        title: "Payment Successful",
        message: `Payment of ₹${order.totalAmount} completed successfully for order #${order.orderNumber}`,
        type: "payment",
        orderId: order.id,
      });

      await storage.createNotification({
        userId: req.user!.id,
        title: "Payment Successful - Order Placed",
        message: `Payment completed for order #${order.orderNumber}. We're finding a driver for you.`,
        type: "order_update",
        orderId: order.id,
      });

      // Notify admin dashboard about payment completion (external webhook only)
      await adminService.notifyPaymentCompleted(
        order,
        payment,
        req.user!
      );

      console.log(`✅ Payment verified and order confirmed:`, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: razorpayPaymentId,
        amount: order.totalAmount,
      });

      res.json({
        success: true,
        payment,
        order: { ...order, status: "pending" }, // Order remains pending until driver accepts
        message: "Payment verified successfully",
      });
    } catch (error) {
      console.error("Razorpay payment verification error:", error);
      res.status(500).json({ error: "Payment verification failed" });
    }
  });

  // Invoice generation - Enhanced with proper formatting and validation
  app.get("/api/orders/:id/invoice", requireAuth, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order || order.customerId !== req.user!.id) {
        return res.status(404).json({ error: "Order not found" });
      }

      console.log(
        `📄 Generating invoice for order ${order.orderNumber}, status: ${order.status}`
      );

      // Allow invoice download for delivered orders or completed payments
      if (
        order.status !== "delivered" &&
        order.status !== "confirmed" &&
        order.status !== "in_transit"
      ) {
        console.log(
          `❌ Invoice not available - order status is ${order.status}`
        );
        return res.status(400).json({
          error: `Invoice is only available for delivered, confirmed, or in-transit orders. Current status: ${order.status}`,
        });
      }

      let payment = await storage.getPaymentByOrder(order.id);
      if (!payment) {
        console.log(`❌ Payment information not found for order ${order.id}`);
        // For COD orders, create a mock payment record for invoice generation
        payment = {
          id: `mock-${order.id}`,
          orderId: order.id,
          customerId: order.customerId,
          amount: order.totalAmount,
          method: "cod" as const,
          status: "completed" as const,
          transactionId: null,
          gatewayResponse: null,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };
        console.log(`📝 Using mock payment data for COD order`);
      } else {
        console.log(`✅ Payment found: ${payment.method} - ${payment.status}`);
      }

      // Generate professional PDF invoice
      console.log(`🔧 Starting PDF generation for order ${order.orderNumber}`);
      let doc;
      try {
        doc = new jsPDF();
        console.log(`✅ jsPDF instance created successfully`);
      } catch (pdfError) {
        console.error(`❌ Failed to create jsPDF instance:`, pdfError);
        const errorMessage =
          pdfError instanceof Error ? pdfError.message : "Unknown error";
        throw new Error(`PDF creation failed: ${errorMessage}`);
      }

      // Set font
      doc.setFont("helvetica");

      // Header with company branding
      doc.setFillColor(25, 118, 210); // Primary blue color
      doc.rect(0, 0, 210, 30, "F");

      // Company logo area and name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("ZAPYGO", 20, 20);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Doorstep Diesel Delivery", 20, 26);

      // Invoice title and details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", 150, 45);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice #: ${order.orderNumber}`, 150, 52);
      doc.text(
        `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
        150,
        58
      );

      if (payment.transactionId) {
        doc.text(`Transaction ID: ${payment.transactionId}`, 150, 64);
      }

      // Customer details section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", 20, 75);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const customerName = req.user!.businessName || req.user!.name || "N/A";
      console.log(`👤 Customer name for invoice: ${customerName}`);
      doc.text(customerName, 20, 83);

      if (req.user!.phone) {
        doc.text(`Phone: ${req.user!.phone}`, 20, 90);
      }

      if (req.user!.email) {
        doc.text(`Email: ${req.user!.email}`, 20, 97);
      }

      if (req.user!.businessAddress) {
        doc.text(`Business Address:`, 20, 104);
        // Handle long addresses by wrapping text
        try {
          const addressLines = doc.splitTextToSize(
            req.user!.businessAddress,
            80
          );
          doc.text(addressLines, 20, 111);
        } catch (addressError) {
          console.error(`❌ Error processing business address:`, addressError);
          doc.text(req.user!.businessAddress.substring(0, 50) + "...", 20, 111);
        }
      }

      // Delivery details
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Delivery Details:", 20, 130);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Delivery Address:", 20, 138);
      try {
        const deliveryLines = doc.splitTextToSize(order.deliveryAddress, 80);
        doc.text(deliveryLines, 20, 145);
      } catch (deliveryError) {
        console.error(`❌ Error processing delivery address:`, deliveryError);
        doc.text(order.deliveryAddress.substring(0, 50) + "...", 20, 145);
      }

      doc.text(
        `Scheduled Date: ${new Date(order.scheduledDate).toLocaleDateString(
          "en-IN"
        )}`,
        20,
        160
      );
      doc.text(`Scheduled Time: ${order.scheduledTime}`, 20, 167);

      // Items table
      const tableStartY = 185;

      // Table headers
      doc.setFillColor(240, 240, 240);
      doc.rect(20, tableStartY, 170, 10, "F");

      doc.setFont("helvetica", "bold");
      doc.text("Description", 25, tableStartY + 7);
      doc.text("Qty", 90, tableStartY + 7);
      doc.text("Rate", 110, tableStartY + 7);
      doc.text("Amount", 150, tableStartY + 7);

      // Table border
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, tableStartY, 170, 10);

      // Items
      doc.setFont("helvetica", "normal");
      let currentY = tableStartY + 20;

      // Diesel fuel line item
      doc.text("Diesel Fuel", 25, currentY);
      doc.text(`${order.quantity}L`, 90, currentY);
      doc.text(
        `Rs.${parseFloat(order.ratePerLiter).toFixed(2)}`,
        110,
        currentY
      );
      doc.text(
        `Rs.${parseFloat(order.subtotal).toLocaleString("en-IN")}`,
        150,
        currentY
      );

      currentY += 10;

      // Delivery charges
      doc.text("Delivery Charges", 25, currentY);
      doc.text("1", 90, currentY);
      doc.text(
        `Rs.${parseFloat(order.deliveryCharges).toFixed(2)}`,
        110,
        currentY
      );
      doc.text(
        `Rs.${parseFloat(order.deliveryCharges).toFixed(2)}`,
        150,
        currentY
      );

      currentY += 10;

      // GST
      doc.text("GST (18%)", 25, currentY);
      doc.text("-", 90, currentY);
      doc.text("-", 110, currentY);
      doc.text(
        `Rs.${parseFloat(order.gst).toLocaleString("en-IN")}`,
        150,
        currentY
      );

      currentY += 15;

      // Total line
      doc.setDrawColor(0, 0, 0);
      doc.line(20, currentY - 5, 190, currentY - 5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Total Amount:", 110, currentY);
      doc.text(
        `Rs.${parseFloat(order.totalAmount).toLocaleString("en-IN")}`,
        150,
        currentY
      );

      // Payment information
      currentY += 20;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Payment Information:", 20, currentY);
      doc.text(`Method: ${payment.method.toUpperCase()}`, 20, currentY + 8);
      doc.text(`Status: ${payment.status.toUpperCase()}`, 20, currentY + 16);
      if (payment.transactionId) {
        doc.text(`Transaction ID: ${payment.transactionId}`, 20, currentY + 24);
        currentY += 32; // Add extra space if transaction ID is present
      } else {
        currentY += 24; // Standard space without transaction ID
      }

      // Footer with proper spacing
      const footerY = Math.max(currentY + 20, 250); // Ensure footer doesn't overlap with content
      doc.setDrawColor(200, 200, 200);
      doc.line(20, footerY, 190, footerY);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Thank you for choosing Zapygo!", 20, footerY + 12);
      doc.text(
        "For support, contact: support@zapygo.com | +91 1800-123-4567",
        20,
        footerY + 20
      );
      doc.text(
        "This is a computer-generated invoice and does not require a signature.",
        20,
        footerY + 28
      );

      console.log(`📦 Converting PDF to buffer for order ${order.orderNumber}`);
      let pdfBuffer;
      try {
        pdfBuffer = Buffer.from(doc.output("arraybuffer"));
        console.log(`📊 PDF buffer size: ${pdfBuffer.length} bytes`);
      } catch (bufferError) {
        console.error(`❌ Failed to create PDF buffer:`, bufferError);
        const errorMessage =
          bufferError instanceof Error ? bufferError.message : "Unknown error";
        throw new Error(`PDF buffer creation failed: ${errorMessage}`);
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice-${order.orderNumber}.pdf`
      );
      res.send(pdfBuffer);

      console.log(
        `✅ Invoice generated and sent for order ${order.orderNumber}`
      );
    } catch (error) {
      console.error("Generate invoice error:", error);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  // Analysis routes
  app.get("/api/analysis", requireAuth, async (req, res) => {
    try {
      const period = (req.query.period as string) || "3months";
      const customerId = req.user!.id;

      // Get customer orders for analysis
      const allOrders = await storage.getUserOrders(customerId, 100);
      const completedOrders = allOrders.filter(
        (order) => order.status === "delivered"
      );

      // Filter orders based on selected period
      const now = new Date();
      let periodStartDate = new Date(now);
      let periodMonths = 3;

      switch (period) {
        case "1month":
          periodMonths = 1;
          periodStartDate.setMonth(periodStartDate.getMonth() - 1);
          break;
        case "3months":
          periodMonths = 3;
          periodStartDate.setMonth(periodStartDate.getMonth() - 3);
          break;
        case "6months":
          periodMonths = 6;
          periodStartDate.setMonth(periodStartDate.getMonth() - 6);
          break;
        case "1year":
          periodMonths = 12;
          periodStartDate.setFullYear(periodStartDate.getFullYear() - 1);
          break;
      }

      // Filter orders for the selected period
      const periodOrders = allOrders.filter(
        (order) => new Date(order.createdAt) >= periodStartDate
      );
      const periodCompletedOrders = completedOrders.filter(
        (order) => new Date(order.createdAt) >= periodStartDate
      );

      if (periodCompletedOrders.length === 0) {
        // Get market price from system settings for empty state
        const marketPriceSetting = await storage.getSystemSetting(
          "market_price_per_liter"
        );
        const marketPrice = parseFloat(marketPriceSetting?.value || "77.5");

        return res.json({
          consumption: {
            totalLiters: 0,
            monthlyAverage: 0,
            lastMonthLiters: 0,
            trend: "stable",
            trendPercentage: 0,
          },
          costs: {
            totalSpent: 0,
            averagePerLiter: 0,
            lastMonthSpent: 0,
            marketPrice,
            savingsPerLiter: 0,
            totalSavings: 0,
          },
          quality: {
            rating: 0,
            deliverySuccess: 0,
            onTimeDelivery: 0,
            qualityScore: 0,
          },
          orders: {
            totalOrders: periodOrders.length,
            completedOrders: 0,
            averageOrderSize: 0,
            frequentDeliveryTime: "Not available",
          },
        });
      }

      // Calculate consumption metrics using period-filtered data
      const totalLiters = periodCompletedOrders.reduce(
        (sum, order) => sum + order.quantity,
        0
      );
      const totalSpent = periodCompletedOrders.reduce(
        (sum, order) => sum + parseFloat(order.totalAmount),
        0
      );
      const averagePerLiter = totalSpent / totalLiters;

      // Get market price from system settings
      const marketPriceSetting = await storage.getSystemSetting(
        "market_price_per_liter"
      );
      const marketPrice = parseFloat(marketPriceSetting?.value || "77.5");
      const savingsPerLiter = Math.max(0, marketPrice - averagePerLiter);
      const totalSavings = savingsPerLiter * totalLiters;

      const monthlyAverage = Math.round(totalLiters / periodMonths);

      // Get last month data (orders from last 30 days)
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

      const lastMonthOrders = periodCompletedOrders.filter(
        (order) => new Date(order.createdAt) >= lastMonthDate
      );
      const lastMonthLiters = lastMonthOrders.reduce(
        (sum, order) => sum + order.quantity,
        0
      );
      const lastMonthSpent = lastMonthOrders.reduce(
        (sum, order) => sum + parseFloat(order.totalAmount),
        0
      );

      // Calculate trend - compare last month to monthly average
      let trend: "up" | "down" | "stable" = "stable";
      let trendPercentage = 0;

      if (monthlyAverage > 0) {
        if (lastMonthLiters > monthlyAverage * 1.1) {
          trend = "up";
          trendPercentage =
            Math.round(
              ((lastMonthLiters - monthlyAverage) / monthlyAverage) * 100 * 10
            ) / 10;
        } else if (lastMonthLiters < monthlyAverage * 0.9) {
          trend = "down";
          trendPercentage =
            Math.round(
              ((monthlyAverage - lastMonthLiters) / monthlyAverage) * 100 * 10
            ) / 10;
        }
      }

      // Calculate delivery success rate for the period
      const deliverySuccessRate =
        periodOrders.length > 0
          ? (periodCompletedOrders.length / periodOrders.length) * 100
          : 0;

      // Calculate most frequent delivery time for the period
      const deliveryTimes = periodCompletedOrders.map(
        (order) => order.scheduledTime
      );
      const timeFrequency: { [key: string]: number } = {};
      deliveryTimes.forEach((time) => {
        timeFrequency[time] = (timeFrequency[time] || 0) + 1;
      });
      const frequentDeliveryTime =
        Object.keys(timeFrequency).length > 0
          ? Object.keys(timeFrequency).reduce((a, b) =>
              timeFrequency[a] > timeFrequency[b] ? a : b
            )
          : "Not available";

      // Calculate quality metrics based on real data
      const onTimeDeliveryRate = 95; // This would need tracking of actual delivery times vs scheduled
      const qualityScore = Math.round(
        (deliverySuccessRate + onTimeDeliveryRate) / 2
      );
      const overallRating = Math.round((qualityScore / 100) * 5 * 10) / 10;

      const analysisData = {
        consumption: {
          totalLiters,
          monthlyAverage,
          lastMonthLiters,
          trend,
          trendPercentage,
        },
        costs: {
          totalSpent: Math.round(totalSpent),
          averagePerLiter: Math.round(averagePerLiter * 10) / 10,
          lastMonthSpent: Math.round(lastMonthSpent),
          marketPrice,
          savingsPerLiter: Math.round(savingsPerLiter * 10) / 10,
          totalSavings: Math.round(totalSavings),
        },
        quality: {
          rating: overallRating,
          deliverySuccess: Math.round(deliverySuccessRate * 10) / 10,
          onTimeDelivery: onTimeDeliveryRate,
          qualityScore: Math.round(qualityScore),
        },
        orders: {
          totalOrders: periodOrders.length,
          completedOrders: periodCompletedOrders.length,
          averageOrderSize:
            periodCompletedOrders.length > 0
              ? Math.round(totalLiters / periodCompletedOrders.length)
              : 0,
          frequentDeliveryTime,
        },
      };

      res.json(analysisData);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ error: "Failed to get analysis data" });
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

  // Mark all as read - MUST come before :id route
  app.put("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
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

  // Serve KYC documents
  app.get("/api/kyc-documents/:filePath(*)", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(
        `/objects/${req.params.filePath}`
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
      const addresses = await storage.getUserCustomerAddresses(req.user!.id);
      res.json({ addresses });
    } catch (error) {
      console.error("Get addresses error:", error);
      res.status(500).json({ error: "Failed to get addresses" });
    }
  });

  app.post("/api/addresses", requireAuth, async (req, res) => {
    try {
      console.log("📮 [BACKEND] Received address creation request");
      console.log(
        "📝 [BACKEND] Request body:",
        JSON.stringify(req.body, null, 2)
      );
      console.log("🗺️ [BACKEND] Latitude received:", req.body.latitude);
      console.log("🗺️ [BACKEND] Longitude received:", req.body.longitude);

      const addressData = {
        ...req.body,
        userId: req.user!.id,
      };

      console.log(
        "💾 [BACKEND] Final address data to save:",
        JSON.stringify(addressData, null, 2)
      );

      // Validate pincode for Bangalore area
      if (!req.body.pincode?.match(/^5[0-9]{5}$/)) {
        return res.status(400).json({ error: "Invalid Bangalore pincode" });
      }

      const address = await storage.createCustomerAddress(addressData);
      console.log(
        "✅ [BACKEND] Address created successfully:",
        JSON.stringify(address, null, 2)
      );
      res.json({ address });
    } catch (error) {
      console.error("💥 [BACKEND] Create address error:", error);
      res.status(400).json({ error: "Failed to create address" });
    }
  });

  app.put("/api/addresses/:id", requireAuth, async (req, res) => {
    try {
      const address = await storage.getCustomerAddress(req.params.id);
      if (!address || address.userId !== req.user!.id) {
        return res.status(404).json({ error: "Address not found" });
      }

      const updatedAddress = await storage.updateCustomerAddress(
        req.params.id,
        req.body
      );
      res.json({ address: updatedAddress });
    } catch (error) {
      console.error("Update address error:", error);
      res.status(400).json({ error: "Failed to update address" });
    }
  });

  app.delete("/api/addresses/:id", requireAuth, async (req, res) => {
    try {
      const address = await storage.getCustomerAddress(req.params.id);
      if (!address || address.userId !== req.user!.id) {
        return res.status(404).json({ error: "Address not found" });
      }

      await storage.deleteCustomerAddress(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete address error:", error);
      res.status(400).json({ error: "Failed to delete address" });
    }
  });

  app.put("/api/addresses/:id/default", requireAuth, async (req, res) => {
    try {
      const address = await storage.getCustomerAddress(req.params.id);
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
        req.params.category
      );
      res.json({ settings });
    } catch (error) {
      console.error("Get settings by category error:", error);
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  // Admin/Dispatch endpoint to assign driver to order
  app.put("/api/orders/:id/assign-driver", requireAdmin, async (req, res) => {
    try {
      const { driverId } = req.body;
      if (!driverId) {
        return res.status(400).json({ error: "Driver ID is required" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const driver = await storage.getDriver(driverId);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      if (!driver.isActive) {
        return res.status(400).json({ error: "Driver is not active" });
      }

      // Assign the driver to the order and update status
      await storage.updateOrderStatus(order.id, "confirmed", driver.id);

      console.log(
        `✅ Driver ${driver.name} assigned to order ${order.orderNumber}`
      );

      // Create notification for customer
      await storage.createNotification({
        userId: order.customerId,
        title: "Driver Assigned",
        message: `${driver.name} has been assigned to deliver your order #${order.orderNumber}`,
        type: "order_update",
        orderId: order.id,
      });

      // Get customer details for admin notification
      const customer = await storage.getUser(order.customerId);
      
      if (customer) {
        // Notify admin dashboard about driver assignment (external webhook only)
        await adminService.notifyOrderStatusChange(
          order,
          customer,
          order.status,
          "confirmed"
        );
      }

      res.json({
        success: true,
        message: "Driver assigned successfully",
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          rating: driver.rating,
        },
      });
    } catch (error) {
      console.error("Assign driver error:", error);
      res.status(400).json({ error: "Failed to assign driver" });
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
        req.user!.id
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
          statusUpdate
        );

        // Update order status in database
        const updatedOrder = await storage.updateOrderStatus(
          statusUpdate.orderId,
          statusUpdate.status,
          statusUpdate.driverId
        );

        console.log(
          `✅ Order ${statusUpdate.orderId} status updated to: ${statusUpdate.status}`
        );

        // If order is now in_transit and has OTP, send it to driver app
        if (statusUpdate.status === "in_transit" && updatedOrder.deliveryOtp) {
          console.log(
            `📤 Order transitioned to in_transit - sending OTP to driver app`
          );
          console.log(
            `🔐 Auto-generated OTP: ${updatedOrder.deliveryOtp} for order: ${updatedOrder.orderNumber}`
          );

          const otpNotificationSuccess = await driverService.sendOtpToDriver(
            updatedOrder.orderNumber,
            updatedOrder.deliveryOtp
          );

          console.log(
            `📱 Driver OTP notification result: ${
              otpNotificationSuccess ? "SUCCESS" : "FAILED"
            }`
          );
        }

        // Create notification for customer
        await storage.createNotification({
          userId: updatedOrder.customerId,
          title: "Order Status Updated",
          message: `Your order #${updatedOrder.orderNumber} is now ${statusUpdate.status.replace('_', ' ')}`,
          type: "order_update",
          orderId: updatedOrder.id,
        });

        // Get customer details for admin notification
        const customer = await storage.getUser(updatedOrder.customerId);
        
        if (customer) {
          // Notify admin dashboard about status change (external webhook only)
          await adminService.notifyOrderStatusChange(
            updatedOrder,
            customer,
            "previous_status",
            statusUpdate.status
          );
        }

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
    }
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
