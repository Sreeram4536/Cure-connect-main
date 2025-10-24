import { IPrescriptionRepository } from "../../repositories/interface/IPrescriptionRepository";
import { IAppointmentRepository } from "../../repositories/interface/IAppointmentRepository";
import { IPrescriptionService, PrescriptionDTO } from "../interface/IPrescriptionService";

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
    
    const created = await this.repo.create({ appointmentId, doctorId, userId, items, notes } as any);
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

  private toPrescriptionDTO(prescription: any): PrescriptionDTO {
    return {
      id: prescription._id.toString(),
      appointmentId: prescription.appointmentId,
      doctorId: prescription.doctorId,
      userId: prescription.userId,
      items: prescription.items,
      notes: prescription.notes,
      createdAt: prescription.createdAt
    };
  }
}


