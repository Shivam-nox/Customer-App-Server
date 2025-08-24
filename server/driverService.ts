import type { Order, User } from "@shared/schema";

interface DriverOrderNotification {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    businessName?: string;
    businessAddress?: string;
  };
  quantity: number;
  ratePerLiter: string;
  subtotal: string;
  deliveryCharges: string;
  gst: string;
  totalAmount: string;
  deliveryAddress: string;
  deliveryAddressId: string;
  deliveryLatitude: string;
  deliveryLongitude: string;
  scheduledDate: string;
  scheduledTime: string;
  createdAt: string;
  notes?: string;
}

export class DriverService {
  private driverAppUrl: string;
  private apiSecret: string;

  constructor() {
    this.driverAppUrl = process.env.DRIVER_APP_URL || '';
    this.apiSecret = process.env.CUSTOMER_APP_KEY || '';
    
    // Remove trailing slash from URL to prevent double slashes
    if (this.driverAppUrl.endsWith('/')) {
      this.driverAppUrl = this.driverAppUrl.slice(0, -1);
    }
    
    if (!this.driverAppUrl) {
      console.warn('DRIVER_APP_URL not configured');
    }
    if (!this.apiSecret) {
      console.warn('CUSTOMER_APP_KEY not configured');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.driverAppUrl || !this.apiSecret) {
        console.log('Driver app integration not configured');
        return false;
      }

      const response = await fetch(`${this.driverAppUrl}/api/test`, {
        method: 'GET',
        headers: {
          'x-api-secret': this.apiSecret,
          'Content-Type': 'application/json',
        },
      });

      const isConnected = response.ok;
      console.log(`Driver app connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      
      if (!isConnected) {
        console.log(`Response status: ${response.status}, ${response.statusText}`);
      }
      
      return isConnected;
    } catch (error) {
      console.error('Driver app connection test failed:', error);
      return false;
    }
  }

  async notifyNewOrder(order: Order, customer: User): Promise<boolean> {
    try {
      if (!this.driverAppUrl || !this.apiSecret) {
        console.log('Driver app integration not configured - skipping notification');
        return false;
      }

      const orderNotification: DriverOrderNotification = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: customer.id,
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          businessName: customer.businessName || undefined,
          businessAddress: customer.businessAddress || undefined,
        },
        quantity: order.quantity,
        ratePerLiter: order.ratePerLiter,
        subtotal: order.subtotal || "0",
        deliveryCharges: order.deliveryCharges,
        gst: order.gst,
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        deliveryAddressId: order.deliveryAddressId || "default",
        deliveryLatitude: order.deliveryLatitude || "0",
        deliveryLongitude: order.deliveryLongitude || "0",
        scheduledDate: order.scheduledDate.toISOString(),
        scheduledTime: order.scheduledTime,
        createdAt: order.createdAt.toISOString(),
        notes: order.notes || undefined,
      };

      console.log(`Notifying driver app about new order: ${order.orderNumber}`);
      console.log(`Using API secret: ${this.apiSecret.substring(0, 10)}...`);
      console.log(`Driver URL: ${this.driverAppUrl}/api/orders`);

      const response = await fetch(`${this.driverAppUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'x-api-secret': this.apiSecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderNotification),
      });

      const success = response.ok;
      
      if (success) {
        console.log(`✅ Successfully notified driver app about order ${order.orderNumber}`);
      } else {
        console.error(`❌ Failed to notify driver app: ${response.status} ${response.statusText}`);
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Driver app error response:', errorText);
        
        // Log specific issues to help debugging
        if (response.status === 401) {
          console.error('🔑 Authentication failed - check CUSTOMER_APP_KEY secret');
        } else if (response.status === 400) {
          console.error('📝 Request validation failed - check payload structure');
        }
      }

      return success;
    } catch (error) {
      console.error('Error notifying driver app:', error);
      return false;
    }
  }

  async getIntegrationInfo() {
    return {
      driverAppUrl: this.driverAppUrl,
      hasApiSecret: !!this.apiSecret,
      endpoints: {
        test: `${this.driverAppUrl}/api/test`,
        createOrder: `${this.driverAppUrl}/api/orders`,
        integrationInfo: `${this.driverAppUrl}/api/integration-info`,
      },
      headers: {
        'x-api-secret': this.apiSecret ? '[CONFIGURED]' : '[MISSING]',
        'Content-Type': 'application/json',
      },
    };
  }
}

export const driverService = new DriverService();