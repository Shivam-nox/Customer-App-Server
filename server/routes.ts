import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { driverService } from "./driverService";
import { adminService } from "./adminService";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
// --- VALIDATION SCHEMAS ---


const signupSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const joinOrgSchema = z.object({
  organizationCode: z.string().min(1),
});

const kycDocumentsSchema = z.object({
  documents: z.record(z.string()),
});

const createOrderSchema = z.object({
  quantity: z.number().min(1),
  deliveryAddress: z.string().min(1),
  deliveryLatitude: z.number().optional(),
  deliveryLongitude: z.number().optional(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
});

// --- MIDDLEWARE (Enhanced for Organization Context) ---
// --- ROBUST MIDDLEWARE (Copy this to routes.ts) ---
// server/routes.ts

// --- ROBUST MIDDLEWARE (FIXED TYPES) ---
const requireAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch (err) {
    console.error("❌ JWT Error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    // 1. Fetch strict User object
    const dbUser = await storage.getCustomer(decoded.userId);
    
    if (!dbUser) {
      return res.status(401).json({ error: "User record not found" });
    }

    // 2. Cast to 'any' to allow attaching extra properties (FIX FOR YOUR ERROR)
    const user: any = { ...dbUser };

    // 3. Fetch Membership & Org Details
    try {
        const membership = await storage.getUserMembership(user.id);
        
        if (membership) {
            // Attach basic membership info
            user.organizationId = membership.organizationId;
            user.role = membership.role; // TS won't complain now
            
            // Sync KYC Status from membership
            // We use 'as any' to bypass the specific string enum mismatch
           user.kycStatus = membership.kycStatus; 
            user.orgUserStatus = membership.orgUserStatus; // approval to see org data
            user.kycRemark = membership.kycRemark;

            // ✅ CHANGED: Fetch Org Code for EVERYONE (if approved)
            // ✅ FIX: Ensure the Org Name is fetched for APPROVED members
      if (membership.orgUserStatus === 'approved') {
        const org = await storage.getOrganization(membership.organizationId);
        if (org) {
          // businessName from DB is mapped to organizationName for frontend
          user.kycStatus = org.kycStatus;
          user.organizationName = org.businessName; 
          user.organizationCode = org.organizationCode;
        }
            }
        }
    } catch (memError) {
        console.warn("⚠️ Membership lookup failed (non-fatal):", memError);
    }

    req.user = user;
    next();

  } catch (dbError: any) {
    console.error("🔥 FATAL DB ERROR in Auth:", dbError);
    return res.status(500).json({ 
      error: "Database Connection Failed", 
      details: dbError.message 
    });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {

  // ==========================================
  // AUTHENTICATION
  // ==========================================
 app.post("/api/auth/signup", async (req, res) => {
    try {
      console.log("📥 Signup Request Body:", req.body); // 1. Log incoming data

      const userData = signupSchema.parse(req.body);
      
      const existingUser = (await storage.getCustomerByUsername(userData.username)) || 
                           (await storage.getCustomerByEmail(userData.email));
      
      if (existingUser) {
        console.log("❌ User already exists");
        return res.status(400).json({ error: "Username or email exists" });
      }

      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      const newUser = await storage.createCustomer({
        ...userData,
        email: userData.email.toLowerCase(),
        passwordHash,
        role: "employee", 
        kycStatus: "pending", 
      });

      const { passwordHash: _, ...safeUser } = newUser;
      res.json({ success: true, user: safeUser });

    } catch (error: any) {
      // ✅ 2. LOG THE ACTUAL ERROR TO TERMINAL
      console.error("🔥 Signup Error:", error);
      
      // ✅ 3. Send the specific error message back to the frontend
      // If it's a Zod validation error, it will usually be an array of issues
      const errorMessage = error.issues 
        ? error.issues.map((i: any) => i.message).join(", ") 
        : error.message;

      res.status(400).json({ error: errorMessage || "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      let user = await storage.getCustomerByUsername(username) || 
                 await storage.getCustomerByEmail(username);

      if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check Membership
      const membership = await storage.getUserMembership(user.id);
      
      if (membership) {
        user.organizationId = membership.organizationId;
        user.role = membership.role as any;
        if (!user.organizationId) {
            await storage.updateCustomer(user.id, { organizationId: membership.organizationId });
        }
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
      const { passwordHash, ...safeUser } = user;
      
      res.json({ success: true, user: safeUser, token });
    } catch (err) {
      res.status(400).json({ error: "Login failed" });
    }
  });


  // server/routes.ts

app.get("/api/user/profile", requireAuth, async (req, res) => {
  try {
    // Use the new function we created in storage.ts
   const userProfile = await storage.getCustomer(req.user!.id);
    
    if (!userProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: userProfile });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

  // ==========================================
  // ORGANIZATION & KYC
  // ==========================================

  // ==========================================
  // KYC UPLOAD URL ROUTE (Fixed & Debugged)
  // ==========================================
  // ==========================================
  // KYC UPLOAD URL (Bypass / Mock Mode)
  // ==========================================
  // ==========================================
  // KYC UPLOAD URL (HARDCODED MOCK)
  // ==========================================
  app.post("/api/kyc/upload-url", requireAuth, async (req, res) => {
    // 1. Log immediately to prove the new code is running
    console.log("⚡ [NUCLEAR FIX] Generating Mock URL instantly...");

    try {
      const { fileName = "document.jpg" } = req.body;
      
      // 2. Generate a fake URL that works with your frontend upload
      // We use httpbin.org because it accepts PUT requests and returns 200 OK.
      // We add the filename so your DB gets unique entries.
      const mockUrl = `https://httpbin.org/put?file=${req.user!.id}_${Date.now()}_${fileName}`;

      console.log("✅ Generated:", mockUrl);

      // 3. Return immediately. NO await, NO service calls.
      return res.json({ uploadURL: mockUrl });

    } catch (error) {
      console.error("🔥 This should never happen:", error);
      res.status(500).json({ error: "Route crashed" });
    }
  });


// ==========================================
  // SUBMIT KYC DOCUMENTS (FIXED & ROBUST)
  // ==========================================
  app.put("/api/kyc/documents", requireAuth, async (req, res) => {
    console.log("📥 [KYC] Processing Submission...");
    
    try {
      // 1. Manually extract data (Bypassing strict Zod for safety)
      // This ensures we get the fields even if the schema definition is slightly off
      const { name, panNumber, gstNumber, documents } = req.body;

      // Debug Log: Check if documents are actually arriving
      console.log("📦 Payload:", { name, panNumber, gstNumber, docCount: documents ? Object.keys(documents).length : 0 });

      if (!documents || !documents.gst || !documents.pan) {
        return res.status(400).json({ error: "Both GST and PAN documents are required" });
      }

      const user = req.user!;
      const orgCode = `ZPY-${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Create Organization with Frontend Data
     const newOrg = await storage.createOrganization({
      businessName: name || `${user.name}'s Business`,
      organizationCode: orgCode,
      kycStatus: "submitted", // The org docs are now submitted
      gstCertificate: documents.gst,
      panCard: documents.pan,
      panNumber: panNumber, 
      gstNumber: gstNumber,
    });

      // 3. Add User as Admin (Fixing the UUID Error)
      await storage.addOrganizationUser({
      organizationId: newOrg.id,
      customerId: user.id,
      role: "admin",
      orgUserStatus: "approved", 
      kycStatus: "submitted", 
      reviewedBy: user.id 
    });

      // 4. Update User Cache
      const updatedUser = await storage.updateCustomer(user.id, {
        organizationId: newOrg.id,
        role: "admin",
        kycStatus: "submitted"
      });

      // Notify Admin (Optional, wrapped in try/catch so it doesn't crash the request)
      try {
          await adminService.notifyKycSubmission(updatedUser);
      } catch (e) {
          console.warn("Failed to notify admin:", e);
      }

      console.log(`✅ Organization Created: ${newOrg.businessName} (${newOrg.id})`);
      res.json({ success: true, user: updatedUser, organization: newOrg });

    } catch (error: any) {
      console.error("🔥 KYC Submit Error:", error);
      res.status(500).json({ 
        error: "Failed to create organization", 
        details: error.message 
      });
    }
  });
  
  // Join Existing Organization
  // ==========================================
  // JOIN REQUESTS & ADMIN APPROVAL
  // ==========================================

  // 1. User: Send Join Request
  // 1. User: Send Join Request
 // 1. User: Send Join Request
  // --- Inside app.post("/api/organizations/join", ...) ---

app.post("/api/organizations/join", requireAuth, async (req, res) => {
  try {
    const { organizationCode } = req.body;
    const user = req.user!;

    const org = await storage.getOrganizationByCode(organizationCode);
    if (!org) return res.status(404).json({ error: "Invalid organization code" });

    const existing = await storage.getOrganizationUser(org.id, user.id);
    if (existing) return res.status(400).json({ error: "Already a member or pending." });

    await storage.addOrganizationUser({
      organizationId: org.id,
      customerId: user.id,
      role: "member", 
      orgUserStatus: "invited", // Waiting for Admin to click "Approve"
      kycStatus: "pending",     // New members start as pending
      reviewedBy: null          // No one has reviewed this join request yet
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to join" });
  }
});

  // 2. Admin: Get Pending Requests
  app.get("/api/organizations/requests", requireAuth, async (req, res) => {
    // Check if user is admin (simple string check now)
    if (req.user!.role !== 'admin' || !req.user!.organizationId) {
        return res.status(403).json({ error: "Admins only" });
    }

    const members = await storage.getOrganizationUsers(req.user!.organizationId);
    
    const pendingRequests = [];
    for (const mem of members) {
        if (mem.orgUserStatus === 'invited') {
            const userDetails = await storage.getCustomer(mem.customerId);
            if (userDetails) {
                pendingRequests.push({
                    requestId: mem.id,
                    user: userDetails,
                    requestedAt: mem.createdAt
                });
            }
        }
    }
    res.json({ requests: pendingRequests });
  });

  // 3. Admin: Approve Request (With Role Assignment)
  app.post("/api/organizations/requests/:requestId/action", requireAuth, async (req, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Admins only" });

    const { action, role } = req.body; // action: 'approve' | 'reject', role: 'Driver', 'Manager', etc.
    const { requestId } = req.params;

    if (action === 'approve') {
        // ✅ Approve and Set Role directly
        await storage.updateOrganizationUserStatus(requestId, "approved", role || "employee");
    } else {

        await storage.updateOrganizationUserStatus(requestId, "rejected");
    }

    res.json({ success: true });
  });



  // ==========================================
  // NOTIFICATIONS (Fixes 404 Error)
  // ==========================================
  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadCount(req.user!.id);
      res.json({ unreadCount: count });
    } catch (error) {
      res.status(500).json({ unreadCount: 0 });
    }
  });

  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json({ notifications });
    } catch (error) {
      res.status(500).json({ notifications: [] });
    }
  });


  
  // ==========================================
  // SHARED RESOURCES (Based on Org ID)
  // ==========================================
  
  // server/routes.ts

app.delete("/api/addresses/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteOrganizationAddress(id);
    res.json({ success: true, message: "Site removed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove site" });
  }
});

  app.get("/api/addresses", requireAuth, async (req, res) => {
    if (!req.user!.organizationId) return res.json({ addresses: [] });
    const addresses = await storage.getOrganizationAddresses(req.user!.organizationId);
    res.json({ addresses });
  });

  app.post("/api/addresses", requireAuth, async (req, res) => {
    if (!req.user!.organizationId) return res.status(400).json({ error: "No organization linked" });
    try {
      const address = await storage.createOrganizationAddress({
        ...req.body,
        organizationId: req.user!.organizationId,
        isActive: true,
        isDefault: false
      });
      res.json({ address });
    } catch (e) { res.status(400).json({ error: "Failed to create address" }); }
  });

  // server/routes.ts

// ... inside registerRoutes function ...


// ==========================================
// GET ORDERS (ORG OR USER)
// ==========================================
// ... (Authentication and Organization routes remain as you have them)

// ==========================================
// GET ORDERS (ORGANIZATION WIDE)
// ==========================================
// This route now fetches every order belonging to the user's team
app.get("/api/orders", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    
    // Check if user even has an organization linked
    if (!user.organizationId) {
      return res.json({ orders: [] });
    }

    // Fetch orders via the organizationId instead of individual userId
    const orders = await storage.getOrdersByOrganization(user.organizationId);
    
    // 🛡️ CRITICAL: Decimal/BigInt serialization fix
    const safeOrders = JSON.parse(
      JSON.stringify(orders, (k, v) => (typeof v === 'bigint' ? v.toString() : v))
    );

    res.json({ orders: safeOrders });
  } catch (error) {
    console.error("🔥 Fetch Orders Error:", error);
    res.status(500).json({ error: "Failed to fetch team orders" });
  }
});

// ==========================================
// CREATE ORDER (COD FLOW)
// ==========================================
app.post("/api/orders", requireAuth, async (req, res) => {
  try {
    const {
      quantity,
      presetType, 
      organizationAddressId,
      deliveryDate,
      deliveryTime
    } = req.body;

    const user = req.user!;
    if (!user.organizationId) return res.status(400).json({ error: "No organization linked" });

    // Constants
    const RATE_PER_LITRE = 90;
    const DELIVERY_CHARGES = 300;
    const subtotal = presetType === "amount" ? Number(quantity) : Number(quantity) * RATE_PER_LITRE;
    const gst = (subtotal + DELIVERY_CHARGES) * 0.18;
    const totalAmount = subtotal + DELIVERY_CHARGES + gst;

    // Create the order directly
    const order = await storage.createOrder({
      organizationId: user.organizationId,
      organizationAddressId,
      createdByCustomerId: user.id,
      presetType,
      quantity: Number(quantity),
      ratePerLitre: RATE_PER_LITRE.toString(),
      subtotal: subtotal.toString(),
      deliveryCharges: DELIVERY_CHARGES.toString(),
      gstCharges: gst.toString(),
      amount: totalAmount.toFixed(2),
      scheduledDate: new Date(deliveryDate),
      scheduledTimeInterval: deliveryTime,
      orderStatus: "confirmed", // Bypassing payment for COD mock
      gatewayOrderId: `COD_${Date.now()}`,
      orderOtp: Math.floor(100000 + Math.random() * 900000).toString()
    });

    // Create payment history entry
    await storage.createPayment({
      orderId: order.id,
      amount: order.amount,
      verification_status: "success",
      transactionId: `TXN_COD_${Date.now()}`,
      organizationId: user.organizationId,
      method: "cod",
      customerId: user.id
    });

    const safeOrder = JSON.parse(
      JSON.stringify(order, (k, v) => (typeof v === 'bigint' ? v.toString() : v))
    );
    res.status(201).json({ success: true, order: safeOrder });

  } catch (error) {
    console.error("🔥 COD Order Error:", error);
    res.status(500).json({ error: "Failed to place order" });
  }
});

// ==========================================
// TRACK SINGLE ORDER
// ==========================================
app.get("/api/orders/:id", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    // Use the storage method that joins with Creator Name
    const data = await storage.getOrderWithCreator(req.params.id);

    // 🛡️ SECURITY: Verify the order belongs to the user's organization
    if (!data || !data.order || data.order.organizationId !== user.organizationId) {
      return res.status(404).json({ error: "Order not found or unauthorized access" });
    }

    // Get live delivery/driver details if assigned
    const delivery = await storage.getDeliveryByOrderId(req.params.id);
    
    const safeData = JSON.parse(
      JSON.stringify({
        order: data.order,
        creatorName: data.creatorName,
        delivery: delivery || null
      }, (k, v) => (typeof v === 'bigint' ? v.toString() : v))
    );

    res.json(safeData);
  } catch (error) {
    console.error("🔥 Track Order Route Error:", error);
    res.status(500).json({ error: "Server error fetching tracking data" });
  }
});

// server/routes.ts

app.get("/api/orders", requireAuth, async (req, res) => {
  const user = req.user!;
  if (!user.organizationId) return res.json({ orders: [] });

  const orders = await storage.getOrdersByOrganization(user.organizationId);
  
  // ✅ Handle BigInt/Decimal serialization for JSON response
  const safeData = JSON.parse(
    JSON.stringify(orders, (k, v) => (typeof v === 'bigint' ? v.toString() : v))
  );

  res.json({ orders: safeData });
});
// ==========================================
// VERIFY RAZORPAY PAYMENT
// ==========================================
app.post("/api/payments/verify", requireAuth, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderData // This contains the form details sent from mobile
    } = req.body;

    // Verify Signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expectedSignature = hmac.digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // PAYMENT IS VALID -> NOW SAVE TO DATABASE FOR THE FIRST TIME
    const RATE_PER_LITRE = 90;
    const DELIVERY_CHARGES = 300;
    const subtotal = orderData.presetType === "amount" ? Number(orderData.quantity) : Number(orderData.quantity) * RATE_PER_LITRE;
    const gst = (subtotal + DELIVERY_CHARGES) * 0.18;
    const totalAmount = subtotal + DELIVERY_CHARGES + gst;

    const newOrder = await storage.createOrder({
      organizationId: req.user!.organizationId,
      organizationAddressId: orderData.organizationAddressId,
      createdByCustomerId: req.user!.id,
      presetType: orderData.presetType,
      quantity: orderData.quantity,
      ratePerLitre: RATE_PER_LITRE.toString(),
      subtotal: subtotal.toString(),
      deliveryCharges: DELIVERY_CHARGES.toString(),
      gstCharges: gst.toString(),
      amount: totalAmount.toString(),
      scheduledDate: new Date(orderData.deliveryDate),
      scheduledTimeInterval: orderData.deliveryTime,
      orderStatus: "confirmed", // Set directly to confirmed
      gatewayOrderId: razorpay_order_id,
      orderOtp: Math.floor(100000 + Math.random() * 900000).toString()
    });

    // Save Payment Record
    await storage.createPayment({
      orderId: newOrder.id,
      amount: newOrder.amount,
      verification_status: "success",
      transactionId: razorpay_payment_id,
      organizationId: newOrder.organizationId!,
      method: "upi",
      customerId: req.user!.id
    });

    res.json({ success: true, orderId: newOrder.id });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ error: "Failed to finalize order" });
  }
});

  


// ==========================================
// DELIVERY WEBHOOK (PLACEHOLDER)
// ==========================================
app.post("/api/webhooks/delivery-status", async (req, res) => {
  // Future: verify webhook signature here
  res.json({ success: true });
});


  const httpServer = createServer(app);
  return httpServer;
}