import { IPrescriptionRepository } from "../../repositories/interface/IPrescriptionRepository";
import { IAppointmentRepository } from "../../repositories/interface/IAppointmentRepository";
import { IPrescriptionService, PrescriptionDTO } from "../interface/IPrescriptionService";
import mongoose from "mongoose";
import { toPrescriptionDTO } from "../../mapper/prescription.mapper";

export class PrescriptionService implements IPrescriptionService {
  constructor(
    private repo: IPrescriptionRepository,
    private appointmentRepo: IAppointmentRepository
  ) {}

  async addPrescription(appointmentId: string, doctorId: string, userId: string, items: any[], notes?: string): Promise<PrescriptionDTO> {
    const appt = await this.appointmentRepo.findById(appointmentId);
    if (!appt) throw new Error("Appointment not found");

    if (String(appt.docId) !== String(doctorId)) throw new Error("Forbidden");
    if (String(appt.userId) !== String(userId)) userId = appt.userId as any;
    
    const existing = await this.repo.findByAppointment(appointmentId);
    if (existing) throw new Error("Prescription already exists");

     const doctorObjectId = new mongoose.Types.ObjectId(doctorId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const created = await this.repo.create({ appointmentId,  doctorId: doctorObjectId,
      userId: userObjectId, items, notes } as any);
    return toPrescriptionDTO(created);
  }

  async getByAppointment(appointmentId: string): Promise<PrescriptionDTO | null> {
    const prescription = await this.repo.findByAppointment(appointmentId);
    return prescription ? toPrescriptionDTO(prescription) : null;
  }

  async listByUser(userId: string): Promise<PrescriptionDTO[]> {
    const prescriptions = await this.repo.listByUser(userId);
    return prescriptions.map(p => toPrescriptionDTO(p));
  }

  async listByDoctor(doctorId: string, userId?: string): Promise<PrescriptionDTO[]> {
    const prescriptions = await this.repo.listByDoctor(doctorId, userId);
    return prescriptions.map(p => toPrescriptionDTO(p));
  }


}


