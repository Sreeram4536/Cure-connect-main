import { IPatientHistoryService, PatientHistoryDTO, MedicalHistoryEntryDTO } from "../interface/IPatientHistoryService";
import { IPatientHistoryRepository } from "../../repositories/interface/IPatientHistoryRepository";
import { PatientHistoryDocument, PatientHistoryItem } from "../../models/patientHistoryModel";
import { PaginationResult } from "../../repositories/interface/IUserRepository";
import { toMedicalHistoryDTO, toPatientHistoryDTO } from "../../mapper/patienthistory.mapper";

export class PatientHistoryService implements IPatientHistoryService {
  constructor(private patientHistoryRepository: IPatientHistoryRepository) {}


  
  async createOrUpdatePatient(
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
  ): Promise<PatientHistoryDTO> {
    const result = await this.patientHistoryRepository.createOrUpdatePatientHistory(userId, patientData);
    return toPatientHistoryDTO(result);
  }

  async addMedicalHistoryFromAppointment(
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
  ): Promise<PatientHistoryDTO | null> {
    const medicalEntry: PatientHistoryItem = {
      appointmentId: appointmentData.appointmentId,
      doctorId: appointmentData.doctorId,
      doctorName: appointmentData.doctorName,
      doctorSpeciality: appointmentData.doctorSpeciality,
      appointmentDate: appointmentData.appointmentDate,
      diagnosis: appointmentData.diagnosis,
      symptoms: appointmentData.symptoms,
      treatment: appointmentData.treatment,
      prescription: appointmentData.prescription,
      vitalSigns: appointmentData.vitalSigns,
      followUpRequired: appointmentData.followUpRequired,
      followUpDate: appointmentData.followUpDate,
      notes: appointmentData.notes,
      createdAt: new Date(),
    };

    const result = await this.patientHistoryRepository.addMedicalHistoryEntry(
      appointmentData.userId,
      medicalEntry
    );

    return result ? toPatientHistoryDTO(result) : null;
  }

  async getPatientHistoryByUserId(userId: string): Promise<PatientHistoryDTO | null> {
    const result = await this.patientHistoryRepository.getPatientHistoryByUserId(userId);
    return result ? toPatientHistoryDTO(result) : null;
  }

  async getPatientsByDoctorId(
    doctorId: string,
    page: number,
    limit: number
  ): Promise<PaginationResult<PatientHistoryDTO>> {
    const result = await this.patientHistoryRepository.getPatientHistoryByDoctorId(doctorId, page, limit);
    
    return {
      ...result,
      data: result.data.map(doc => toPatientHistoryDTO(doc))
    };
  }

  async getPatientHistoryForDoctor(
    doctorId: string,
    userId: string
  ): Promise<PatientHistoryDTO | null> {
    const result = await this.patientHistoryRepository.getPatientHistoryForDoctor(doctorId, userId);
    return result ? toPatientHistoryDTO(result) : null;
  }

  async searchPatients(
    doctorId: string,
    searchQuery: string,
    page: number,
    limit: number
  ): Promise<PaginationResult<PatientHistoryDTO>> {
    const result = await this.patientHistoryRepository.searchPatients(doctorId, searchQuery, page, limit);
    
    return {
      ...result,
      data: result.data.map(doc => toPatientHistoryDTO(doc))
    };
  }

  async updatePatientBasicInfo(
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
  ): Promise<PatientHistoryDTO | null> {
    const result = await this.patientHistoryRepository.updatePatientBasicInfo(userId, updateData);
    return result ? toPatientHistoryDTO(result) : null;
  }

  async getMedicalHistoryByAppointmentId(appointmentId: string): Promise<MedicalHistoryEntryDTO | null> {
    const result = await this.patientHistoryRepository.getMedicalHistoryByAppointmentId(appointmentId);
    return result ? toMedicalHistoryDTO(result) : null;
  }

  async updateMedicalHistoryEntry(
    userId: string,
    appointmentId: string,
    updateData: Partial<MedicalHistoryEntryDTO>
  ): Promise<PatientHistoryDTO | null> {
    // Convert string dates to Date objects for the repository
    const repositoryUpdateData: Partial<PatientHistoryItem> = {
      ...updateData,
      appointmentDate: updateData.appointmentDate ? new Date(updateData.appointmentDate) : undefined,
      followUpDate: updateData.followUpDate ? new Date(updateData.followUpDate) : undefined,
      createdAt: updateData.createdAt ? new Date(updateData.createdAt) : undefined,
    };
    
    const result = await this.patientHistoryRepository.updateMedicalHistoryEntry(userId, appointmentId, repositoryUpdateData);
    return result ? toPatientHistoryDTO(result) : null;
  }

  async deleteMedicalHistoryEntry(
    userId: string,
    appointmentId: string
  ): Promise<PatientHistoryDTO | null> {
    const result = await this.patientHistoryRepository.deleteMedicalHistoryEntry(userId, appointmentId);
    return result ? toPatientHistoryDTO(result) : null;
  }

  async getPatientMedicalHistoryByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MedicalHistoryEntryDTO[]> {
    const patientHistory = await this.patientHistoryRepository.getPatientHistoryByUserId(userId);
    
    if (!patientHistory) return [];

    return patientHistory.medicalHistory
      .filter(entry => 
        entry.appointmentDate >= startDate && entry.appointmentDate <= endDate
      )
      .sort((a, b) => b.appointmentDate.getTime() - a.appointmentDate.getTime())
      .map(entry => toMedicalHistoryDTO(entry));
  }

  async getRecentMedicalHistory(
    userId: string,
    limit: number
  ): Promise<MedicalHistoryEntryDTO[]> {
    const patientHistory = await this.patientHistoryRepository.getPatientHistoryByUserId(userId);
    
    if (!patientHistory) return [];

    return patientHistory.medicalHistory
      .sort((a, b) => b.appointmentDate.getTime() - a.appointmentDate.getTime())
      .slice(0, limit)
      .map(entry => toMedicalHistoryDTO(entry));
  }
}
