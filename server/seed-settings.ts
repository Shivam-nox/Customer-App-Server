import { storage } from "./storage";

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

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSystemSettings().then(() => process.exit(0));
}

export { seedSystemSettings };