import { AppointmentRepository } from "../../repositories/implementation/AppointmentRepository";
import { PrescriptionRepository } from "../../repositories/implementation/PrescriptionRepository";
import { IAppointmentCompletionService } from "../interface/IAppointmentCompletionService";
import { IPatientHistoryService } from "../interface/IPatientHistoryService";
import { DoctorRepository } from "../../repositories/implementation/DoctorRepository";

export class AppointmentCompletionService implements IAppointmentCompletionService {
  constructor(
    private appointmentRepo: AppointmentRepository,
    private prescriptionRepo: PrescriptionRepository,
    private patientHistoryService: IPatientHistoryService,
    private doctorRepo: DoctorRepository
  ) {}

  async completeAppointment(appointmentId: string): Promise<void> {
    const appt = await this.appointmentRepo.findById(appointmentId);
    if (!appt) throw new Error("Appointment not found");
    const pres = await this.prescriptionRepo.findByAppointment(appointmentId);
    if (!pres) throw new Error("Add prescription first");
    
    // Mark appointment as completed
    appt.isCompleted = true as any;
    await appt.save();

    // Add medical history entry
    try {
      const doctor = await this.doctorRepo.findById(appt.docId);
      if (doctor) {
        // Create or update patient basic info
        await this.patientHistoryService.createOrUpdatePatient(appt.userId, {
          patientName: appt.userData.name,
          patientEmail: appt.userData.email,
          patientPhone: appt.userData.phone,
        });

        // Add medical history entry
        await this.patientHistoryService.addMedicalHistoryFromAppointment({
          appointmentId: appointmentId,
          userId: appt.userId,
          doctorId: appt.docId,
          doctorName: doctor.name,
          doctorSpeciality: doctor.speciality,
          appointmentDate: appt.date,
          diagnosis: pres.notes || "General consultation",
          prescription: {
            items: pres.items,
            notes: pres.notes
          },
          notes: pres.notes
        });
      }
    } catch (error) {
      console.error("Error adding medical history:", error);
      // Don't throw error here as appointment completion should still succeed
    }
  }
}


