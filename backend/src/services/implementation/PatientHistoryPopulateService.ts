import { IPatientHistoryService } from "../interface/IPatientHistoryService";
import { IAppointmentRepository } from "../../repositories/interface/IAppointmentRepository";
import { IPrescriptionRepository } from "../../repositories/interface/IPrescriptionRepository";
import { IDoctorRepository } from "../../repositories/interface/IDoctorRepository";
import { IUserRepository } from "../../repositories/interface/IUserRepository";

export class PatientHistoryPopulateService {
  constructor(
    private patientHistoryService: IPatientHistoryService,
    private appointmentRepository: IAppointmentRepository,
    private prescriptionRepository: IPrescriptionRepository,
    private doctorRepository: IDoctorRepository,
    private userRepository: IUserRepository
  ) {}

  async populatePatientHistoryFromAppointments(doctorId: string, userId: string) {
    try {
      // Get user data first
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Get doctor data
      const doctor = await this.doctorRepository.findById(doctorId);
      if (!doctor) {
        throw new Error("Doctor not found");
      }

      // Create or update patient basic info (even if no appointments exist)
      await this.patientHistoryService.createOrUpdatePatient(userId, {
        patientName: user.name,
        patientEmail: user.email,
        patientPhone: user.phone,
        patientDob: user.dob ? new Date(user.dob) : undefined,
        patientGender: user.gender,
      });

      // Get all completed appointments for this doctor and user
      const appointments = await this.appointmentRepository.findAppointmentsByCriteria({
        docId: doctorId,
        userId: userId,
        isCompleted: true
      });

      // If no completed appointments, still return basic patient info
      if (appointments.length === 0) {
        return await this.patientHistoryService.getPatientHistoryForDoctor(doctorId, userId);
      }

      // Process each appointment
      for (const appointment of appointments) {
        // Check if this appointment already has a medical history entry
        const existingEntry = await this.patientHistoryService.getMedicalHistoryByAppointmentId(appointment._id.toString());
        
        if (!existingEntry) {
          // Get prescription for this appointment
          const prescription = await this.prescriptionRepository.findByAppointment(appointment._id.toString());
          
          // Create medical history entry
          await this.patientHistoryService.addMedicalHistoryFromAppointment({
            appointmentId: appointment._id.toString(),
            userId: userId,
            doctorId: doctorId,
            doctorName: doctor.name,
            doctorSpeciality: doctor.speciality,
            appointmentDate: appointment.date,
            diagnosis: prescription?.notes || "General consultation",
            prescription: prescription ? {
              items: prescription.items,
              notes: prescription.notes
            } : undefined,
            notes: prescription?.notes
          });
        }
      }

      // Return the populated patient history
      return await this.patientHistoryService.getPatientHistoryForDoctor(doctorId, userId);
    } catch (error) {
      console.error("Error populating patient history:", error);
      throw error;
    }
  }
}
