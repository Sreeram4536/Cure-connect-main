export interface PrescriptionDTO {
  id: string;
  appointmentId: string;
  doctorId: string;
  userId: string;
   doctor?: {
    name: string;
    specialization: string;
  };
  patient?: {
    name: string;
    gender: string;
    dob: Date;
  };
  items: Array<{
    name: string;
    dosage: string;
    instructions?: string;
  }>;
  notes?: string;
  createdAt: Date;
}