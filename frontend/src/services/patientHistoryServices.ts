import { getApi } from "../axios/axiosInstance";
import type { 
  PatientHistoryDTO, 
  MedicalHistoryEntryDTO, 
  PaginationResult, 
  PatientHistorySearchParams, 
  PatientHistoryDateRangeParams 
} from "../types/patientHistory";

class PatientHistoryService {
  private api = getApi("doctor");

  // Get patient history for a specific patient
  async getPatientHistory(userId: string): Promise<PatientHistoryDTO> {
    console.log('PatientHistoryService - getPatientHistory called with userId:', userId);
    const url = `/api/doctor/patient-history/patient/${userId}`;
    console.log('Making request to:', url);
    console.log('Full URL will be:', this.api.defaults.baseURL + url);
    
    try {
      const response = await this.api.get(url);
      console.log('PatientHistoryService - response received:', response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch patient history');
      }
    } catch (error: any) {
      console.error('PatientHistoryService - Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Get all patients seen by the doctor
  async getPatientsByDoctor(page: number = 1, limit: number = 10): Promise<PaginationResult<PatientHistoryDTO>> {
    const response = await this.api.get(`/api/doctor/patient-history/patients`, {
      params: { page, limit }
    });
    return {
      data: response.data.data,
      ...response.data.pagination
    };
  }

  // Search patients
  async searchPatients(params: PatientHistorySearchParams): Promise<PaginationResult<PatientHistoryDTO>> {
    const response = await this.api.get(`/api/doctor/patient-history/patients/search`, {
      params: {
        query: params.query,
        page: params.page || 1,
        limit: params.limit || 10
      }
    });
    return {
      data: response.data.data,
      ...response.data.pagination
    };
  }

  // Get medical history for a specific appointment
  async getMedicalHistoryByAppointment(appointmentId: string): Promise<MedicalHistoryEntryDTO> {
    const response = await this.api.get(`/api/doctor/patient-history/appointment/${appointmentId}`);
    return response.data.data;
  }

  // Update patient basic information
  async updatePatientInfo(userId: string, updateData: {
    patientName?: string;
    patientEmail?: string;
    patientPhone?: string;
    patientDob?: string;
    patientGender?: string;
    allergies?: string[];
    chronicConditions?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  }): Promise<PatientHistoryDTO> {
    const response = await this.api.put(`/api/doctor/patient-history/patient/${userId}`, updateData);
    return response.data.data;
  }

  // Update medical history entry
  async updateMedicalHistoryEntry(
    userId: string, 
    appointmentId: string, 
    updateData: Partial<MedicalHistoryEntryDTO>
  ): Promise<PatientHistoryDTO> {
    const response = await this.api.put(`/api/doctor/patient-history/patient/${userId}/appointment/${appointmentId}`, updateData);
    return response.data.data;
  }

  // Delete medical history entry
  async deleteMedicalHistoryEntry(userId: string, appointmentId: string): Promise<PatientHistoryDTO> {
    const response = await this.api.delete(`/api/doctor/patient-history/patient/${userId}/appointment/${appointmentId}`);
    return response.data.data;
  }

  // Get patient's medical history by date range
  async getMedicalHistoryByDateRange(
    userId: string, 
    params: PatientHistoryDateRangeParams
  ): Promise<MedicalHistoryEntryDTO[]> {
    const response = await this.api.get(`/api/doctor/patient-history/patient/${userId}/date-range`, {
      params: {
        startDate: params.startDate,
        endDate: params.endDate
      }
    });
    return response.data.data;
  }

  // Get recent medical history for a patient
  async getRecentMedicalHistory(userId: string, limit: number = 5): Promise<MedicalHistoryEntryDTO[]> {
    const response = await this.api.get(`/api/doctor/patient-history/patient/${userId}/recent`, {
      params: { limit }
    });
    return response.data.data;
  }

  // Add medical history from appointment completion
  async addMedicalHistoryFromAppointment(appointmentData: {
    appointmentId: string;
    userId: string;
    doctorId: string;
    doctorName: string;
    doctorSpeciality: string;
    appointmentDate: string;
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
    followUpDate?: string;
    notes?: string;
  }): Promise<PatientHistoryDTO> {
    const response = await this.api.post(`/api/doctor/patient-history/appointment`, appointmentData);
    return response.data.data;
  }
}

export const patientHistoryService = new PatientHistoryService();