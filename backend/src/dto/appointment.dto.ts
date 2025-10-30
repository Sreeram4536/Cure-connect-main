export interface AppointmentDTO {
  id: string;
  _id?: string; 
  userId: string;
  docId: string;
  slotDate: string;
  slotTime: string;
  amount: number;
  date: Date;
  cancelled: boolean;
  payment: boolean;
  status: "pending" | "confirmed" | "cancelled";
  isConfirmed: boolean;
  isCompleted: boolean;
 
  userData?: {
    name: string;
    email: string;
    image?: string;
    dob?: string;
  };
  docData?: {
    name: string;
    speciality: string;
    image?: string;
  };
  
}