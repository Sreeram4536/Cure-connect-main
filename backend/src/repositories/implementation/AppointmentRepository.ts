import appointmentModel, { AppointmentDocument } from "../../models/appointmentModel";
import { IAppointmentRepository } from "../interface/IAppointmentRepository";
import { AppointmentTypes } from "../../types/appointment";

export class AppointmentRepository implements IAppointmentRepository {
  async findBySlot(docId: string, slotDate: string, slotTime: string): Promise<AppointmentDocument | null> {
    return appointmentModel.findOne({ docId, slotDate, slotTime });
  }
  async findById(id: string): Promise<AppointmentDocument | null> {
    return appointmentModel.findById(id);
  }
  async findUserDoctor(userId: string, docId: string, slotDate: string, slotTime: string): Promise<AppointmentDocument | null> {
    return appointmentModel.findOne({ userId, docId, slotDate, slotTime });
  }
  async createAppointment(data: Partial<AppointmentTypes>): Promise<AppointmentDocument> {
    return appointmentModel.create(data);
  }
  async updateAppointment(id: string, data: Partial<AppointmentTypes>): Promise<AppointmentDocument | null> {
    return appointmentModel.findByIdAndUpdate(id, data, { new: true });
  }
} 