import prescriptionModel, { PrescriptionDocument } from "../../models/prescriptionModel";
import { IPrescriptionRepository } from "../interface/IPrescriptionRepository";

export class PrescriptionRepository implements IPrescriptionRepository {
  async create(data: Omit<PrescriptionDocument, keyof Document | "_id" | "createdAt"> & { items: any[] }): Promise<PrescriptionDocument> {
    const doc = await prescriptionModel.create(data as any);
    return doc;
  }

  async findByAppointment(appointmentId: string): Promise<PrescriptionDocument | null> {
    return prescriptionModel.findOne({ appointmentId })
     .populate("doctorId", "name speciality")  
    .populate("userId", "name dob gender"); 
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


