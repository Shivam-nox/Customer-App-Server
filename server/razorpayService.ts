import Razorpay from 'razorpay';
import crypto from 'crypto';

class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      console.error('❌ Razorpay credentials not found in environment variables');
      throw new Error('Razorpay credentials not configured');
    }
    
    console.log('🔑 Initializing Razorpay with key:', keyId.substring(0, 10) + '...');
    
    try {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      console.log('✅ Razorpay instance created successfully');
    } catch (error) {
      console.error('❌ Failed to create Razorpay instance:', error);
      throw error;
    }
  }

  async createOrder(amount: number, currency: string = 'INR', receipt?: string) {
    try {
      const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency,
        receipt: receipt || `order_${Date.now()}`,
      };

      console.log('💳 Creating Razorpay order with options:', options);
      const order = await this.razorpay.orders.create(options);
      console.log('✅ Razorpay order created successfully:', order.id);
      return order;
    } catch (error) {
      console.error('❌ Razorpay order creation error:', error);
      throw new Error(`Failed to create Razorpay order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    try {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === razorpaySignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  async getPaymentDetails(paymentId: string) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  async refundPayment(paymentId: string, amount?: number) {
    try {
      const refundOptions: any = {};
      if (amount) {
        refundOptions.amount = Math.round(amount * 100); // Amount in paise
      }

      const refund = await this.razorpay.payments.refund(paymentId, refundOptions);
      return refund;
    } catch (error) {
      console.error('Refund creation error:', error);
      throw new Error('Failed to create refund');
    }
  }
}

export const razorpayService = new RazorpayService();