import { AppointmentDocument } from "../../types/appointment";

export interface ILeaveManagementRepository {
  findAppointmentsByDoctorAndDate(doctorId: string, date: string): Promise<AppointmentDocument[]>;
  updateAppointmentStatus(appointmentId: string, updateData: {
    status: string;
    cancelled: boolean;
    cancelledBy: string;
    cancelledAt: Date;
    cancellationReason: string;
  }): Promise<void>;
}
