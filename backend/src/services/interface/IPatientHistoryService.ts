import { PatientHistoryDocument, PatientHistoryItem } from "../../models/patientHistoryModel";
import { PaginationResult } from "../../repositories/interface/IUserRepository";

export interface PatientHistoryDTO {
  id: string;
  userId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientDob?: string; // ISO date string
  patientGender?: string;
  medicalHistory: MedicalHistoryEntryDTO[];
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface MedicalHistoryEntryDTO {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  doctorSpeciality: string;
  appointmentDate: string; // ISO date string
  diagnosis: string;
  symptoms?: string;
  treatment?: string;
  prescription?: {
    items: Array<{
      name: string;
      dosage: string;
      instructions?: string;
    }>;
    notes?: string;
  };
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  followUpRequired?: boolean;
  followUpDate?: string; // ISO date string
  notes?: string;
  createdAt: string; // ISO date string
}

export interface IPatientHistoryService {
  // Create or update patient basic information
  createOrUpdatePatient(
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
  ): Promise<PatientHistoryDTO>;

  // Add medical history entry from appointment and prescription
  addMedicalHistoryFromAppointment(
    appointmentData: {
      appointmentId: string;
      userId: string;
      doctorId: string;
      doctorName: string;
      doctorSpeciality: string;
      appointmentDate: Date;
      diagnosis: string;
      symptoms?: string;
      treatment?: string;
      prescription?: {
        items: Array<{
          name: string;
          dosage: string;
          instructions?: string;
        }>;
        notes?: string;
      };
      vitalSigns?: {
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        weight?: number;
        height?: number;
      };
      followUpRequired?: boolean;
      followUpDate?: Date;
      notes?: string;
    }
  ): Promise<PatientHistoryDTO | null>;

  // Get patient history by user ID
  getPatientHistoryByUserId(userId: string): Promise<PatientHistoryDTO | null>;

  // Get all patients seen by a doctor
  getPatientsByDoctorId(
    doctorId: string,
    page: number,
    limit: number
  ): Promise<PaginationResult<PatientHistoryDTO>>;

  // Get specific patient history for a doctor
  getPatientHistoryForDoctor(
    doctorId: string,
    userId: string
  ): Promise<PatientHistoryDTO | null>;

  // Search patients by name, email, or phone
  searchPatients(
    doctorId: string,
    searchQuery: string,
    page: number,
    limit: number
  ): Promise<PaginationResult<PatientHistoryDTO>>;

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
  ): Promise<PatientHistoryDTO | null>;

  // Get medical history entry by appointment ID
  getMedicalHistoryByAppointmentId(appointmentId: string): Promise<MedicalHistoryEntryDTO | null>;

  // Update medical history entry
  updateMedicalHistoryEntry(
    userId: string,
    appointmentId: string,
    updateData: Partial<MedicalHistoryEntryDTO>
  ): Promise<PatientHistoryDTO | null>;

  // Delete medical history entry
  deleteMedicalHistoryEntry(
    userId: string,
    appointmentId: string
  ): Promise<PatientHistoryDTO | null>;

  // Get patient's medical history for a specific date range
  getPatientMedicalHistoryByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MedicalHistoryEntryDTO[]>;

  // Get recent medical history for a patient (last N entries)
  getRecentMedicalHistory(
    userId: string,
    limit: number
  ): Promise<MedicalHistoryEntryDTO[]>;
}
