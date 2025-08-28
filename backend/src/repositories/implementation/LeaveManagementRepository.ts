import { ILeaveManagementRepository } from "../interface/ILeaveManagementRepository";
import { AppointmentDocument } from "../../types/appointment";
import appointmentModel from "../../models/appointmentModel";

export class LeaveManagementRepository implements ILeaveManagementRepository {
  async findAppointmentsByDoctorAndDate(doctorId: string, date: string): Promise<AppointmentDocument[]> {
    return appointmentModel.find({
      docId: doctorId,
      slotDate: date,
      status: { $in: ['confirmed', 'pending'] },
      cancelled: { $ne: true }
    });
  }

  async updateAppointmentStatus(appointmentId: string, updateData: {
    status: string;
    cancelled: boolean;
    cancelledBy: string;
    cancelledAt: Date;
    cancellationReason: string;
  }): Promise<void> {
    await appointmentModel.findByIdAndUpdate(appointmentId, updateData);
  }
}
