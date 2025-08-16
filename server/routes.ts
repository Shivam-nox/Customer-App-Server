import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import jsPDF from 'jspdf';
import "./types";

// Validation schemas
const sendOtpSchema = z.object({
  identifier: z.string().min(1),
  type: z.enum(["phone", "email"]),
});

const verifyOtpSchema = z.object({
  identifier: z.string().min(1),
  otp: z.string().length(6),
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
  method: z.enum(["upi", "cards", "netbanking", "wallet"]),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id'];
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
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { identifier, type } = sendOtpSchema.parse(req.body);
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      await storage.createOtp({
        identifier,
        otp,
        type,
        expiresAt,
      });
      
      // In production, send actual OTP via SMS/Email
      console.log(`OTP for ${identifier}: ${otp}`);
      
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(400).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { identifier, otp } = verifyOtpSchema.parse(req.body);
      
      const verification = await storage.getValidOtp(identifier, otp);
      if (!verification) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
      
      await storage.markOtpVerified(verification.id);
      
      // Check if user exists
      let user = await storage.getUserByPhone(identifier) || await storage.getUserByEmail(identifier);
      
      if (!user) {
        // Create new user
        const userData = verification.type === "phone" 
          ? { phone: identifier, name: "", role: "customer" as const }
          : { email: identifier, name: "", role: "customer" as const };
        
        user = await storage.createUser(userData);
      }
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          businessName: user.businessName,
          kycStatus: user.kycStatus
        }
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(400).json({ error: "Failed to verify OTP" });
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
        kycStatus: "submitted"
      });
      
      // Create notification
      await storage.createNotification({
        userId: user.id,
        title: "KYC Documents Submitted",
        message: "Your KYC documents have been submitted for verification. You'll be notified once reviewed.",
        type: "kyc"
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
      
      // Calculate pricing
      const ratePerLiter = 70.50;
      const subtotal = orderData.quantity * ratePerLiter;
      const deliveryCharges = 300;
      const gst = subtotal * 0.18;
      const totalAmount = subtotal + deliveryCharges + gst;
      
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
        status: "pending"
      });
      
      // Create notification
      await storage.createNotification({
        userId: req.user!.id,
        title: "Order Created",
        message: `Your order #${order.orderNumber} has been created successfully.`,
        type: "order_update",
        orderId: order.id
      });
      
      res.json({ order });
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

  // Payment routes
  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      const { orderId, method } = processPaymentSchema.parse(req.body);
      
      const order = await storage.getOrder(orderId);
      if (!order || order.customerId !== req.user!.id) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const payment = await storage.createPayment({
        orderId,
        customerId: req.user!.id,
        amount: order.totalAmount,
        method,
        status: "processing"
      });
      
      // Simulate payment processing
      setTimeout(async () => {
        try {
          const transactionId = `TXN${Date.now()}`;
          await storage.updatePaymentStatus(payment.id, "completed", transactionId);
          await storage.updateOrderStatus(orderId, "confirmed");
          
          // Create delivery record with mock driver
          await storage.createDelivery({
            orderId,
            driverId: "driver-1", // Mock driver ID
            driverName: "Rajesh Kumar",
            vehicleNumber: "MH 01 AB 1234",
            driverPhone: "+91 98765 43210",
            driverRating: "4.8"
          });
          
          // Create notifications
          await storage.createNotification({
            userId: req.user!.id,
            title: "Payment Successful",
            message: `Payment of ₹${order.totalAmount} completed successfully.`,
            type: "payment",
            orderId
          });
          
          await storage.createNotification({
            userId: req.user!.id,
            title: "Order Confirmed",
            message: `Your order #${order.orderNumber} has been confirmed and assigned to a driver.`,
            type: "order_update",
            orderId
          });
        } catch (error) {
          console.error("Payment processing error:", error);
        }
      }, 2000);
      
      res.json({ payment, message: "Payment processing initiated" });
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
      doc.text('ZAPYGO', 20, 20);
      doc.setFontSize(12);
      doc.text('Doorstep Diesel Delivery', 20, 30);
      
      // Invoice details
      doc.setFontSize(16);
      doc.text('INVOICE', 150, 20);
      doc.setFontSize(10);
      doc.text(`Invoice #: ${order.orderNumber}`, 150, 30);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 150, 38);
      
      // Customer details
      doc.setFontSize(12);
      doc.text('Bill To:', 20, 60);
      doc.setFontSize(10);
      doc.text(req.user!.businessName || req.user!.name, 20, 70);
      doc.text(req.user!.phone || '', 20, 78);
      doc.text(req.user!.email || '', 20, 86);
      
      // Order details
      doc.text('Delivery Address:', 20, 100);
      doc.text(order.deliveryAddress, 20, 108);
      
      // Items table
      doc.line(20, 125, 190, 125);
      doc.text('Description', 25, 135);
      doc.text('Qty', 100, 135);
      doc.text('Rate', 130, 135);
      doc.text('Amount', 160, 135);
      doc.line(20, 140, 190, 140);
      
      doc.text('Diesel Fuel', 25, 150);
      doc.text(`${order.quantity}L`, 100, 150);
      doc.text(`₹${order.ratePerLiter}`, 130, 150);
      doc.text(`₹${order.subtotal}`, 160, 150);
      
      doc.text('Delivery Charges', 25, 160);
      doc.text('1', 100, 160);
      doc.text(`₹${order.deliveryCharges}`, 130, 160);
      doc.text(`₹${order.deliveryCharges}`, 160, 160);
      
      doc.text('GST (18%)', 25, 170);
      doc.text('-', 100, 170);
      doc.text('-', 130, 170);
      doc.text(`₹${order.gst}`, 160, 170);
      
      doc.line(20, 175, 190, 175);
      doc.setFontSize(12);
      doc.text('Total Amount:', 130, 185);
      doc.text(`₹${order.totalAmount}`, 160, 185);
      
      // Footer
      doc.setFontSize(8);
      doc.text('Thank you for choosing Zapygo!', 20, 250);
      doc.text('For support, contact: support@zapygo.com | +91 1800-123-4567', 20, 260);
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
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

  // Mock driver location updates (for simulation)
  app.post("/api/orders/:id/update-driver-location", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const delivery = await storage.updateDriverLocation(req.params.id, latitude, longitude);
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
      const objectFile = await objectStorageService.getObjectEntityFile(`/objects/${req.params.filePath}`);
      
      // Check if user owns this document (basic security)
      // In production, implement proper ACL checking
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Get KYC document error:", error);
      res.status(404).json({ error: "Document not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
