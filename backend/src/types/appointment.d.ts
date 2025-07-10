export interface AppointmentTypes {
  userId: string;
  docId: string;
  slotDate: string;
  slotTime: string;
  userData: Record<string, any>;
  docData: Record<string, any>;
  amount: number;
  date: number | Date;
  cancelled?: boolean;
  payment?: boolean;
  isConfirmed?: boolean;
  isCompleted?: boolean;
  razorpayOrderId?: string | null;
  status?: 'pending' | 'confirmed' | 'cancelled';
  lockExpiresAt?: Date | null;
}


export interface AppointmentDocument
  extends AppointmentTypes, Document {
  _id: Types.ObjectId;
}
