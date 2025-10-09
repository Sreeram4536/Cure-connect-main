import { PrescriptionDocument } from "../../models/prescriptionModel";

export interface IPrescriptionRepository {
  create(data: Omit<PrescriptionDocument, keyof Document | "_id" | "createdAt"> & { items: any[] }): Promise<PrescriptionDocument>;
  findByAppointment(appointmentId: string): Promise<PrescriptionDocument | null>;
  listByUser(userId: string): Promise<PrescriptionDocument[]>;
  listByDoctor(doctorId: string, userId?: string): Promise<PrescriptionDocument[]>;
}
