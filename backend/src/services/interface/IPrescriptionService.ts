export interface PrescriptionDTO {
  id: string;
  appointmentId: string;
  doctorId: string;
  userId: string;
  items: Array<{
    name: string;
    dosage: string;
    instructions?: string;
  }>;
  notes?: string;
  createdAt: Date;
}

export interface IPrescriptionService {
  addPrescription(
    appointmentId: string,
    doctorId: string,
    userId: string,
    items: any[],
    notes?: string
  ): Promise<PrescriptionDTO>;

  getByAppointment(appointmentId: string): Promise<PrescriptionDTO | null>;

  listByUser(userId: string): Promise<PrescriptionDTO[]>;

  listByDoctor(doctorId: string, userId?: string): Promise<PrescriptionDTO[]>;
}


