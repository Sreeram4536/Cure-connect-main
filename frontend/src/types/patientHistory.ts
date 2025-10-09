export interface PrescriptionDetailsDTO {
  items: Array<{
    name: string;
    dosage: string;
    instructions?: string;
  }>;
  notes?: string;
}

export interface VitalSignsDTO {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
}

export interface EmergencyContactDTO {
  name: string;
  phone: string;
  relationship: string;
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
  prescription?: PrescriptionDetailsDTO;
  vitalSigns?: VitalSignsDTO;
  followUpRequired?: boolean;
  followUpDate?: string; // ISO date string
  notes?: string;
  createdAt: string; // ISO date string
}

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
  emergencyContact?: EmergencyContactDTO;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface PaginationResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PatientHistorySearchParams {
  query: string;
  page?: number;
  limit?: number;
}

export interface PatientHistoryDateRangeParams {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}