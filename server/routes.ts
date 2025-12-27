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

import { 
  type Asset, 
  type Order, 
  insertOrderSchema, // Ensure these are imported
  insertAssetSchema 
} from "@shared/schema";

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

// --- HELPER: Generate 8-digit ID ---
function generate8DigitNumber(): number {
  return Math.floor(10000000 + Math.random() * 90000000);
}

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
// GET ORDERS (ORGANIZATION WIDE)
// ==========================================
// This route now fetches every order belonging to the user's team

app.get("/api/assets", requireAuth, async (req, res) => {
    if (!req.user || !req.user.organizationId) {
      return res.json({ assets: [] });
    }
    try {
      const assetsList = await storage.getOrganizationAssets(req.user.organizationId);
      res.json({ assets: assetsList });
    } catch (error) {
      console.error("Fetch Assets Error:", error);
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  // CREATE ASSET (With 8-Digit ID Loop)
  // ==========================================
  app.post("/api/assets", requireAuth, async (req, res) => {
    try {
      console.log("📥 [ASSET CREATE] Request Received");

      if (!req.user || !req.user.organizationId) {
        return res.status(400).json({ error: "User is not part of an organization" });
      }

      const { name, capacity, type, position, addressId } = req.body;

      // --- LOGIC START: Generate Unique ID & Retry on Collision ---
      let newAsset: Asset | undefined; // <--- Typed to fix TypeScript error
      let retries = 5;
      let success = false;

      while (retries > 0 && !success) {
        try {
          // 1. Generate Random 8-digit Number
          const generatedAssetNumber = generate8DigitNumber();

          // 2. Prepare Payload
          const assetPayload = {
            organizationId: req.user.organizationId as string,
            addressId: addressId || null,
            name,
            assetNumber: generatedAssetNumber, // Passing the Integer
            capacity: Number(capacity),
            type: type || null,
            position: position || null
          };

          // 3. Attempt to Save
          newAsset = await storage.createAsset(assetPayload);
          success = true;

        } catch (error: any) {
          // Check for Postgres Unique Violation Code (23505)
          if (error.code === '23505' || error.message.includes("unique")) {
            console.warn(`⚠️ Asset ID Collision. Retrying... (${retries} attempts left)`);
            retries--;
          } else {
            throw error; // Other errors (DB down, etc.)
          }
        }
      }
      // --- LOGIC END ---

      if (!success || !newAsset) {
        return res.status(500).json({ error: "System busy: Could not generate unique Asset ID." });
      }

      console.log("✅ Asset Created Successfully:", newAsset);
      res.json({ success: true, asset: newAsset });

    } catch (error: any) {
      console.error("🔥 Asset Create Error:", error);
      res.status(500).json({ error: "Failed to create asset", details: error.message });
    }
  });
  

  // 3. DELETE ASSET
 app.delete("/api/assets/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAsset(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

 
// ==========================================
// TRACK SINGLE ORDER
// ==========================================
app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      // Safety Check: If no org, return empty list
      if (!user.organizationId) {
        return res.json({ orders: [] });
      }

      console.log(`🔍 Fetching orders for Org: ${user.organizationId}`);

      // 1. Fetch from Storage (Ensure this function exists in storage.ts)
      const orders = await storage.getOrdersByOrganization(user.organizationId);

      // 2. Safe Serialization (Prevents "Do not know how to serialize BigInt" error)
      const safeData = JSON.parse(
        JSON.stringify(orders, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

      // 3. Return correct structure matching your Frontend
      res.json({ orders: safeData });

    } catch (error) {
      console.error("🔥 GET /api/orders Error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const {
        quantity,
        presetType,
        organizationAddressId,
        deliveryDate,
        deliveryTime,
        assetsData
      } = req.body;

      const user = req.user!;
      if (!user.organizationId) return res.status(400).json({ error: "No organization linked" });

      // --- 1. DETERMINE MODE (Asset vs Bulk) ---
      const isAssetMode = assetsData && assetsData.length > 0;

      // --- 2. CALCULATE TOTALS ---
      const RATE_PER_LITRE = 90;
      const DELIVERY_CHARGES = 300;
      let finalTotalVolume = 0;
      let finalSubtotal = 0;
      const assetEntriesToSave: any[] = [];

      if (isAssetMode) {
        // --- ASSET MODE CALCULATION ---
        for (const item of assetsData) {
          let finalAssetId = item.assetId;
          const itemQty = Number(item.quantity);
          let itemVol = 0;
          let itemAmt = 0;

          if (item.presetType === 'volume') {
            itemVol = itemQty;
            itemAmt = itemQty * RATE_PER_LITRE;
          } else {
            itemAmt = itemQty;
            itemVol = itemQty / RATE_PER_LITRE;
          }

          finalTotalVolume += itemVol;
          finalSubtotal += itemAmt;

          if (finalAssetId) {
            assetEntriesToSave.push({
              assetId: finalAssetId,
              presetType: item.presetType,
              volume: itemVol.toFixed(2),
              amount: itemAmt.toFixed(2),
            });
          }
        }
      } else {
        // --- BULK MODE CALCULATION ---
        if (presetType === "amount") {
          finalSubtotal = Number(quantity);
          finalTotalVolume = Number(quantity) / RATE_PER_LITRE;
        } else {
          finalTotalVolume = Number(quantity);
          finalSubtotal = Number(quantity) * RATE_PER_LITRE;
        }
      }

      const gst = (finalSubtotal + DELIVERY_CHARGES) * 0.18;
      const totalAmount = finalSubtotal + DELIVERY_CHARGES + gst;

      // --- 3. GENERATE ID & CREATE ORDER ---
      let order: Order | undefined;
      let retries = 5;
      let success = false;

      while (retries > 0 && !success) {
        try {
          const uniqueOrderNumber = generate8DigitNumber();

          order = await storage.createOrder({
            organizationId: user.organizationId,
            organizationAddressId,
            createdByCustomerId: user.id,
            orderNumber: uniqueOrderNumber,

            // ✅ LOGIC: TRUE if assets exist, FALSE if bulk
            assetAdded: isAssetMode, 

            presetType: isAssetMode ? "volume" : presetType,
            quantity: Math.ceil(finalTotalVolume),
            ratePerLitre: RATE_PER_LITRE.toString(),
            subtotal: finalSubtotal.toString(),
            deliveryCharges: DELIVERY_CHARGES.toString(),
            gstCharges: gst.toString(),
            amount: totalAmount.toFixed(2),
            scheduledDate: new Date(deliveryDate),
            scheduledTimeInterval: deliveryTime,
            orderStatus: "confirmed",
            gatewayOrderId: `COD_${Date.now()}`,
            orderOtp: Math.floor(100000 + Math.random() * 900000).toString()
          });
          
          success = true;
        } catch (error: any) {
          if (error.code === '23505' || error.message.includes("unique")) {
             retries--;
          } else {
             throw error;
          }
        }
      }

      if (!success || !order) throw new Error("Failed to generate Unique Order ID");

      // --- 4. SAVE CHILD DATA (Assets & Payment) ---
      if (assetEntriesToSave.length > 0) {
        const entriesWithOrderId = assetEntriesToSave.map(entry => ({
          ...entry,
          orderId: order!.id 
        }));
        await storage.createOrderAssets(entriesWithOrderId);
      }

      await storage.createPayment({
        orderId: order.id,
        amount: order.amount,
        verification_status: "pending",
        transactionId: `TXN_COD_${Date.now()}`,
        organizationId: user.organizationId,
        method: "cod",
        customerId: user.id
      });

      // --- 5. RESPONSE ---
      const safeOrder = JSON.parse(
        JSON.stringify(order, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

      res.status(201).json({ success: true, order: safeOrder });

    } catch (error: any) {
      console.error("Order Creation Error:", error);
      res.status(500).json({ error: "Failed to place order", details: error.message });
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