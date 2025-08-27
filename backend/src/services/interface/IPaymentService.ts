import  Razorpay from "razorpay";
import { Orders } from "razorpay/dist/types/orders";

export interface RazorpayOrderPayload {
  fees: number; // amount in paise
  currency: "INR";
  receipt: string;
}

export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
}

export interface IPaymentService {
  createOrder(amountPaise: number, receipt: string): Promise<Orders.RazorpayOrder>;
  fetchOrder(razorpayOrderId: string): Promise<Orders.RazorpayOrder>;
}
