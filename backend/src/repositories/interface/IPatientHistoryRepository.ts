import { PatientHistoryDocument, PatientHistoryItem } from "../../models/patientHistoryModel";
import { PaginationResult } from "./IUserRepository";

export interface IPatientHistoryRepository {
  // Create or update patient history
  createOrUpdatePatientHistory(
    userId: string,
    patientData: {
      patientName: string;
      patientEmail: string;
      patientPhone: string;
      patientDob?: Date;
      patientGender?: string;
      allergies?: string[];
      chronicConditions?: string[];
      emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
      };
    }
  ): Promise<PatientHistoryDocument>;

  // Add medical history entry
  addMedicalHistoryEntry(
    userId: string,
    medicalEntry: PatientHistoryItem
  ): Promise<PatientHistoryDocument | null>;

  // Get patient history by user ID
  getPatientHistoryByUserId(userId: string): Promise<PatientHistoryDocument | null>;

  // Get patient history by doctor ID (all patients seen by this doctor)
  getPatientHistoryByDoctorId(
    doctorId: string,
    page: number,
    limit: number
  ): Promise<PaginationResult<PatientHistoryDocument>>;

  // Get specific patient history for a doctor
  getPatientHistoryForDoctor(
    doctorId: string,
    userId: string
  ): Promise<PatientHistoryDocument | null>;

  // Search patients by name or email
  searchPatients(
    doctorId: string,
    searchQuery: string,
    page: number,
    limit: number
  ): Promise<PaginationResult<PatientHistoryDocument>>;

  // Update patient basic information
  updatePatientBasicInfo(
    userId: string,
    updateData: {
      patientName?: string;
      patientEmail?: string;
      patientPhone?: string;
      patientDob?: Date;
      patientGender?: string;
      allergies?: string[];
      chronicConditions?: string[];
      emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
      };
    }
  ): Promise<PatientHistoryDocument | null>;

  // Get medical history entries for a specific appointment
  getMedicalHistoryByAppointmentId(appointmentId: string): Promise<PatientHistoryItem | null>;

  // Update medical history entry
  updateMedicalHistoryEntry(
    userId: string,
    appointmentId: string,
    updateData: Partial<PatientHistoryItem>
  ): Promise<PatientHistoryDocument | null>;

  // Delete medical history entry
  deleteMedicalHistoryEntry(
    userId: string,
    appointmentId: string
  ): Promise<PatientHistoryDocument | null>;
}



