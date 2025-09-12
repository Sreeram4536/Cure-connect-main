import { AppointmentRepository } from "../../repositories/implementation/AppointmentRepository";
import { PrescriptionRepository } from "../../repositories/implementation/PrescriptionRepository";
import { IAppointmentCompletionService } from "../interface/IAppointmentCompletionService";

export class AppointmentCompletionService implements IAppointmentCompletionService {
  constructor(
    private appointmentRepo: AppointmentRepository,
    private prescriptionRepo: PrescriptionRepository
  ) {}

  async completeAppointment(appointmentId: string): Promise<void> {
    const appt = await this.appointmentRepo.findById(appointmentId);
    if (!appt) throw new Error("Appointment not found");
    const pres = await this.prescriptionRepo.findByAppointment(appointmentId);
    if (!pres) throw new Error("Add prescription first");
    appt.isCompleted = true as any;
    await appt.save();
  }
}


