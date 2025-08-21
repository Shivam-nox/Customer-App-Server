import type { Order, User } from "@shared/schema";

interface DriverOrderNotification {
  orderId: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    businessName?: string;
    businessAddress?: string;
  };
  quantity: number;
  deliveryAddress: string;
  deliveryLatitude?: string;
  deliveryLongitude?: string;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: string;
  ratePerLiter: string;
  deliveryCharges: string;
  gst: string;
  createdAt: string;
  notes?: string;
}

export class DriverService {
  private driverAppUrl: string;
  private apiSecret: string;

  constructor() {
    this.driverAppUrl = process.env.DRIVER_APP_URL || '';
    this.apiSecret = process.env.CUSTOMER_APP_KEY || '';
    
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
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          businessName: customer.businessName || undefined,
          businessAddress: customer.businessAddress || undefined,
        },
        quantity: order.quantity,
        deliveryAddress: order.deliveryAddress,
        deliveryLatitude: order.deliveryLatitude || undefined,
        deliveryLongitude: order.deliveryLongitude || undefined,
        scheduledDate: order.scheduledDate.toISOString(),
        scheduledTime: order.scheduledTime,
        totalAmount: order.totalAmount,
        ratePerLiter: order.ratePerLiter,
        deliveryCharges: order.deliveryCharges,
        gst: order.gst,
        createdAt: order.createdAt.toISOString(),
        notes: order.notes || undefined,
      };

      console.log(`Notifying driver app about new order: ${order.orderNumber}`);

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
        console.log(`Successfully notified driver app about order ${order.orderNumber}`);
      } else {
        console.error(`Failed to notify driver app: ${response.status} ${response.statusText}`);
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Driver app error response:', errorText);
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