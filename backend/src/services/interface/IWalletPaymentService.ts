import { WalletPaymentData, WalletPaymentResponse } from "../../types/appointment";

export interface IWalletPaymentService {
  processWalletPayment(paymentData: WalletPaymentData): Promise<WalletPaymentResponse>;
  validateWalletBalance(userId: string, amount: number): Promise<boolean>;
  finalizeWalletPayment(appointmentId: string, userId: string, amount: number): Promise<WalletPaymentResponse>;
} 