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

