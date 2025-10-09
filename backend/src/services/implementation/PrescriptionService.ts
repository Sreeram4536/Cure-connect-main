import { PrescriptionRepository } from "../../repositories/implementation/PrescriptionRepository";
import appointmentModel from "../../models/appointmentModel";

export class PrescriptionService {
  constructor(private repo: PrescriptionRepository) {}

  async addPrescription(appointmentId: string, doctorId: string, userId: string, items: any[], notes?: string) {
    const appt = await appointmentModel.findById(appointmentId);
     console.log("APPOINTMENT OBJ TYPE:", appt?.constructor?.name);
    if (!appt) throw new Error("Appointment not found");
    console.log("appt.docId:", appt.docId.toString(), "doctorId from token:", doctorId);

    if (String(appt.docId) !== String(doctorId)) throw new Error("Forbidden");
    if (String(appt.userId) !== String(userId)) userId = appt.userId as any;
    const existing = await this.repo.findByAppointment(appointmentId);
    if (existing) throw new Error("Prescription already exists");
    return this.repo.create({ appointmentId, doctorId, userId, items, notes } as any);
  }

  async getByAppointment(appointmentId: string) {
    return this.repo.findByAppointment(appointmentId);
  }

  async listByUser(userId: string) {
    return this.repo.listByUser(userId);
  }

  async listByDoctor(doctorId: string, userId?: string) {
    return this.repo.listByDoctor(doctorId, userId);
  }
}


