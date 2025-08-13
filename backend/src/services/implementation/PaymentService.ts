import Razorpay from "razorpay";

export interface RazorpayOrderPayload {
  fees: number;
  currency: "INR";
  receipt: string;
}

export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
}

export class PaymentService {
  private razorpay: Razorpay | null = null;

  constructor() {
    // Only initialize Razorpay if environment variables are available
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } else {
      console.warn("Razorpay environment variables not found. Payment service will be limited.");
    }
  }

  async createOrder(amountPaise: number, receipt: string) {
    if (!this.razorpay) {
      throw new Error("Razorpay not configured. Please check environment variables.");
    }
    
    const order = await this.razorpay.orders.create({
      amount: amountPaise,
      currency: process.env.CURRENCY || "INR",
      receipt,
    });
    return order;
  }

  async fetchOrder(razorpay_order_id: string) {
    if (!this.razorpay) {
      throw new Error("Razorpay not configured. Please check environment variables.");
    }
    
    return await this.razorpay.orders.fetch(razorpay_order_id);
  }
}
