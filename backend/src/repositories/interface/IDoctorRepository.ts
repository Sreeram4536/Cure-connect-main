import { AppointmentTypes } from "../../types/appointment";
import { DoctorData, DoctorDocument } from "../../types/doctor";

export interface PaginationResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IDoctorRepository {
  registerDoctor(data: DoctorData): Promise<DoctorDocument>;
  findById(id: string): Promise<DoctorData | null>;
  updateAvailability(id: string, available: boolean): Promise<void>;
  findAllDoctors(): Promise<Partial<DoctorData>[]>;
  getDoctorsPaginated(page: number, limit: number, speciality?: string, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<PaginationResult<Partial<DoctorData>>>;
  findByEmail(email: string): Promise<DoctorData | null>;
  save(doctor: DoctorDocument): Promise<void>;
  findAppointmentsByDoctorId(docId: string): Promise<AppointmentTypes[]>;
  getAppointmentsPaginated(docId: string, page: number, limit: number): Promise<PaginationResult<AppointmentTypes>>;
  findAppointmentById(id: string): Promise<AppointmentTypes | null>;
  findPayableAppointment(docId: string, appointmentId: string): Promise<AppointmentTypes>;
  markAppointmentAsConfirmed(id: string): Promise<void>;
  cancelAppointment(id: string): Promise<void>;
  getDoctorProfileById(id: string): Promise<DoctorData | null>;
  updateDoctorProfile(
    id: string,
    updateData: Partial<
      Pick<
        DoctorData,
        "name" | "speciality" | "degree" | "experience" | "about" | "fees" | "address" | "image"
      >
    >
  ): Promise<void>;
  getDoctorsByStatusAndLimit(status: string, limit: number): Promise<Partial<DoctorData>[]>;
  updateById(id: string, updateData: Partial<DoctorData>): Promise<void>;
}
