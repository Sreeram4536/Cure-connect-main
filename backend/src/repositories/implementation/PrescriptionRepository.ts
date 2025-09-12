import prescriptionModel, { PrescriptionDocument } from "../../models/prescriptionModel";

export class PrescriptionRepository {
  async create(data: Omit<PrescriptionDocument, keyof Document | "_id" | "createdAt"> & { items: any[] }): Promise<PrescriptionDocument> {
    const doc = await prescriptionModel.create(data as any);
    return doc;
  }

  async findByAppointment(appointmentId: string): Promise<PrescriptionDocument | null> {
    return prescriptionModel.findOne({ appointmentId });
  }

  async listByUser(userId: string) {
    return prescriptionModel.find({ userId }).sort({ createdAt: -1 });
  }

  async listByDoctor(doctorId: string, userId?: string) {
    const query: any = { doctorId };
    if (userId) query.userId = userId;
    return prescriptionModel.find(query).sort({ createdAt: -1 });
  }
}


