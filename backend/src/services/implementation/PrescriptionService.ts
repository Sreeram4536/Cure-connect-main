import { IPrescriptionRepository } from "../../repositories/interface/IPrescriptionRepository";
import { IAppointmentRepository } from "../../repositories/interface/IAppointmentRepository";
import { IPrescriptionService, PrescriptionDTO } from "../interface/IPrescriptionService";
import mongoose from "mongoose";

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
    return this.toPrescriptionDTO(created);
  }

  async getByAppointment(appointmentId: string): Promise<PrescriptionDTO | null> {
    const prescription = await this.repo.findByAppointment(appointmentId);
    return prescription ? this.toPrescriptionDTO(prescription) : null;
  }

  async listByUser(userId: string): Promise<PrescriptionDTO[]> {
    const prescriptions = await this.repo.listByUser(userId);
    return prescriptions.map(p => this.toPrescriptionDTO(p));
  }

  async listByDoctor(doctorId: string, userId?: string): Promise<PrescriptionDTO[]> {
    const prescriptions = await this.repo.listByDoctor(doctorId, userId);
    return prescriptions.map(p => this.toPrescriptionDTO(p));
  }

  // private toPrescriptionDTO(prescription: any): PrescriptionDTO {
  //   return {
  //     id: prescription._id.toString(),
  //     appointmentId: prescription.appointmentId,
  //     doctorId: prescription.doctorId,
  //     userId: prescription.userId,
  //     items: prescription.items,
  //     notes: prescription.notes,
  //     createdAt: prescription.createdAt
  //   };
  // }
   private toPrescriptionDTO(prescription: any): PrescriptionDTO {
    return {
      id: prescription._id.toString(),
      appointmentId: prescription.appointmentId,
      doctorId:
        typeof prescription.doctorId === "object"
          ? prescription.doctorId._id?.toString()
          : prescription.doctorId.toString(),
      userId:
        typeof prescription.userId === "object"
          ? prescription.userId._id?.toString()
          : prescription.userId.toString(),
      doctor:
        prescription.doctorId && typeof prescription.doctorId === "object"
          ? {
              name: prescription.doctorId.name,
              specialization: prescription.doctorId.speciality,
            }
          : undefined,
      patient:
        prescription.userId && typeof prescription.userId === "object"
          ? {
              name: prescription.userId.name,
              dob: prescription.userId.dob,
              gender: prescription.userId.gender,
            }
          : undefined,
      items: prescription.items,
      notes: prescription.notes,
      createdAt: prescription.createdAt,
    };
  }

}


