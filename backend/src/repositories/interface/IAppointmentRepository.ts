import { AppointmentTypes } from "../../types/appointment";
import { AppointmentDocument } from "../../models/appointmentModel";

export interface IAppointmentRepository {
  findBySlot(docId: string, slotDate: string, slotTime: string): Promise<AppointmentDocument | null>;
  findById(id: string): Promise<AppointmentDocument | null>;
  findUserDoctor(userId: string, docId: string, slotDate: string, slotTime: string): Promise<AppointmentDocument | null>;
  createAppointment(data: Partial<AppointmentTypes>): Promise<AppointmentDocument>;
  updateAppointment(id: string, data: Partial<AppointmentTypes>): Promise<AppointmentDocument | null>;
  countPaidAppointments(): Promise<number>;
  countPaidAppointmentsByDoctor(docId: string): Promise<number>;
  findAppointmentsByCriteria(criteria: any): Promise<AppointmentDocument[]>;
} 