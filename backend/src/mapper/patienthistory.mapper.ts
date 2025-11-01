import { MedicalHistoryEntryDTO, PatientHistoryDTO } from "../dto/patienthistory.dto";
import { PatientHistoryDocument, PatientHistoryItem } from "../models/patientHistoryModel";

export const toPatientHistoryDTO=(document: PatientHistoryDocument): PatientHistoryDTO => {
    return {
      id: document._id.toString(),
      userId: document.userId,
      patientName: document.patientName,
      patientEmail: document.patientEmail,
      patientPhone: document.patientPhone,
      patientDob: document.patientDob?.toISOString(),
      patientGender: document.patientGender,
      medicalHistory: document.medicalHistory.map(entry => toMedicalHistoryDTO(entry)),
      allergies: document.allergies,
      chronicConditions: document.chronicConditions,
      emergencyContact: document.emergencyContact,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }

   export const toMedicalHistoryDTO=(entry: PatientHistoryItem): MedicalHistoryEntryDTO =>{
      return {
        appointmentId: entry.appointmentId,
        doctorId: entry.doctorId,
        doctorName: entry.doctorName,
        doctorSpeciality: entry.doctorSpeciality,
        appointmentDate: entry.appointmentDate.toISOString(),
        diagnosis: entry.diagnosis,
        symptoms: entry.symptoms,
        treatment: entry.treatment,
        prescription: entry.prescription,
        vitalSigns: entry.vitalSigns,
        followUpRequired: entry.followUpRequired,
        followUpDate: entry.followUpDate?.toISOString(),
        notes: entry.notes,
        createdAt: entry.createdAt.toISOString(),
      };
    }