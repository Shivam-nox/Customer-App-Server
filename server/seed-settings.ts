import { storage } from "./storage";
import type { InsertDriver } from "@shared/schema";

async function seedSystemSettings() {
  try {
    console.log("Seeding system settings...");

    const defaultSettings = [
      {
        key: "rate_per_liter",
        value: "70.50",
        dataType: "number",
        description: "Price per liter of diesel in rupees",
        category: "pricing",
        isEditable: true,
      },
      {
        key: "delivery_charges",
        value: "300",
        dataType: "number", 
        description: "Flat delivery charges in rupees",
        category: "pricing",
        isEditable: true,
      },
      {
        key: "gst_rate",
        value: "0.18",
        dataType: "number",
        description: "GST rate as a decimal (18%)",
        category: "tax",
        isEditable: true,
      },
      {
        key: "minimum_order_quantity",
        value: "100",
        dataType: "number",
        description: "Minimum order quantity in liters",
        category: "order",
        isEditable: true,
      },
      {
        key: "maximum_order_quantity",
        value: "10000",
        dataType: "number",
        description: "Maximum order quantity in liters",
        category: "order",
        isEditable: true,
      },
      {
        key: "order_step",
        value: "50",
        dataType: "number",
        description: "Order quantity step/increment in liters",
        category: "order",
        isEditable: true,
      },
      {
        key: "service_area_pincode_pattern",
        value: "^5[0-9]{5}$",
        dataType: "string",
        description: "Regex pattern for Bangalore service area pincodes",
        category: "delivery",
        isEditable: true,
      },
      {
        key: "company_name",
        value: "Zapygo",
        dataType: "string",
        description: "Company name for branding",
        category: "branding",
        isEditable: false,
      },
      {
        key: "support_phone",
        value: "+91-9876543210",
        dataType: "string",
        description: "Customer support phone number",
        category: "contact",
        isEditable: true,
      },
      {
        key: "support_email",
        value: "support@zapygo.com",
        dataType: "string",
        description: "Customer support email address",
        category: "contact",
        isEditable: true,
      },
      {
        key: "market_price_per_liter",
        value: "77.50",
        dataType: "number",
        description: "Current market price per liter of diesel for savings calculation",
        category: "pricing",
        isEditable: true,
      },
      {
        key: "delivery_time_slots",
        value: JSON.stringify([
          { value: "09:00", label: "9-11am" },
          { value: "11:00", label: "11am-1pm" },
          { value: "13:00", label: "1-3pm" },
          { value: "15:00", label: "3-5pm" },
          { value: "17:00", label: "5-7pm" },
          { value: "19:00", label: "7-9pm" }
        ]),
        dataType: "json",
        description: "Available delivery time slots",
        category: "delivery",
        isEditable: true,
      }
    ];

    for (const setting of defaultSettings) {
      const existing = await storage.getSystemSetting(setting.key);
      if (!existing) {
        await storage.createSystemSetting(setting);
        console.log(`Created setting: ${setting.key}`);
      } else {
        console.log(`Setting already exists: ${setting.key}`);
      }
    }

    console.log("System settings seeding completed!");
  } catch (error) {
    console.error("Error seeding system settings:", error);
  }
}

async function seedSampleDriver() {
  try {
    console.log("Seeding sample driver data...");

    const drivers = [
      {
        name: "Rajesh Kumar",
        phone: "+91-9876543210",
        email: "rajesh.driver@zapygo.com",
        address: "HSR Layout, Bangalore",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560102",
        kycStatus: "verified" as const,
        emergencyContactName: "Sunita Kumar",
        emergencyContactPhone: "+91-9876543211",
        status: "online" as const,
        isActive: true,
        currentLocation: JSON.stringify({
          lat: 12.9141,
          lng: 77.6101,
          timestamp: new Date().toISOString(),
          address: "HSR Layout, Bangalore"
        }),
        stats: { totalDeliveries: 150, successfulDeliveries: 145, deliveriesThisMonth: 23 }
      },
      {
        name: "Amit Sharma", 
        phone: "+91-9876543220",
        email: "amit.driver@zapygo.com",
        address: "Koramangala, Bangalore",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560034",
        kycStatus: "verified" as const,
        emergencyContactName: "Priya Sharma",
        emergencyContactPhone: "+91-9876543221",
        status: "online" as const,
        isActive: true,
        currentLocation: JSON.stringify({
          lat: 12.9352,
          lng: 77.6245,
          timestamp: new Date().toISOString(),
          address: "Koramangala, Bangalore"
        }),
        stats: { totalDeliveries: 89, successfulDeliveries: 85, deliveriesThisMonth: 18 }
      },
      {
        name: "Suresh Reddy",
        phone: "+91-9876543230", 
        email: "suresh.driver@zapygo.com",
        address: "Whitefield, Bangalore",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560066",
        kycStatus: "verified" as const,
        emergencyContactName: "Lakshmi Reddy",
        emergencyContactPhone: "+91-9876543231",
        status: "online" as const,
        isActive: true,
        currentLocation: JSON.stringify({
          lat: 12.9698,
          lng: 77.7500,
          timestamp: new Date().toISOString(),
          address: "Whitefield, Bangalore"
        }),
        stats: { totalDeliveries: 203, successfulDeliveries: 198, deliveriesThisMonth: 31 }
      }
    ];

    for (const driverData of drivers) {
      const existingDriver = await storage.getDriverByPhone(driverData.phone);
      if (existingDriver) {
        console.log(`Driver ${driverData.name} already exists`);
        continue;
      }

      // Create driver without system-managed fields
      const { stats, ...driverInfo } = driverData;
      const createdDriver = await storage.createDriver(driverInfo);
      
      // Note: System-managed fields like totalDeliveries, rating etc. 
      // would be updated by the system as deliveries are completed
      
      console.log(`✅ Created driver: ${driverData.name} (${driverData.phone})`);
    }
  } catch (error) {
    console.error("Error seeding sample drivers:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  Promise.all([seedSystemSettings(), seedSampleDriver()]).then(() => process.exit(0));
}

async function assignSampleDriverToOrder() {
  try {
    console.log("Looking for orders to assign drivers...");
    
    // Get a sample customer and their orders
    const orders = await storage.getUserOrders("a35ed64c-13ba-4d73-96fd-82f2f1b2d1e0", 10);
    if (orders.length === 0) {
      console.log("No orders found to assign driver");
      return;
    }

    // Get available drivers
    const driverPhones = ["+91-9876543210", "+91-9876543220", "+91-9876543230"];
    const drivers = [];
    
    for (const phone of driverPhones) {
      const driver = await storage.getDriverByPhone(phone);
      if (driver) {
        drivers.push(driver);
      }
    }

    if (drivers.length === 0) {
      console.log("No drivers found. Run seed-settings first.");
      return;
    }

    // Assign drivers to orders that don't have them
    const ordersWithoutDrivers = orders.filter(order => !order.driverId);
    let assignedCount = 0;

    for (const order of ordersWithoutDrivers.slice(0, 3)) {
      const driver = drivers[assignedCount % drivers.length];
      await storage.updateOrderStatus(order.id, "confirmed", driver.id);
      console.log(`✅ Assigned driver ${driver.name} to order ${order.orderNumber}`);
      assignedCount++;
    }

    if (assignedCount === 0) {
      console.log("All orders already have drivers assigned");
    } else {
      console.log(`Assigned ${assignedCount} drivers to orders`);
    }
  } catch (error) {
    console.error("Error assigning drivers to orders:", error);
  }
}

export { seedSystemSettings, seedSampleDriver, assignSampleDriverToOrder };