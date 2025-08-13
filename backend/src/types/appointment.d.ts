export interface AppointmentTypes {
  userId: string;
  docId: string;
  slotDate: string;
  slotTime: string;
  userData: {
    name: string;
    email: string;
    phone: string;
  };
  docData: {
    name: string;
    speciality: string;
    image: string;
  };
  amount: number;
  date: Date;
  cancelled: boolean;
  payment: boolean;
  status: "pending" | "confirmed" | "cancelled";
  lockExpiresAt?: Date;
  isConfirmed: boolean;
  isCompleted: boolean;
  razorpayOrderId?: string;
  paymentMethod?: 'razorpay' | 'wallet';
  walletTransactionId?: string;
  
  // New fields for cancellation tracking
  cancelledBy?: "user" | "doctor" | "admin";
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface WalletPaymentData {
  userId: string;
  docId: string;
  slotDate: string;
  slotTime: string;
  amount: number;
  appointmentId: string;
}

export interface WalletPaymentResponse {
  success: boolean;
  message: string;
  appointmentId?: string;
  transactionId?: string;
}


export interface AppointmentDocument
  extends AppointmentTypes, Document {
  _id: Types.ObjectId;
}
