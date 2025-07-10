import { IUserRepository } from "../../repositories/interface/IUserRepository";
import userModel from "../../models/userModel";
import doctorModel from "../../models/doctorModel";
import { AppointmentDocument, AppointmentTypes } from "../../types/appointment";
import appointmentModel from "../../models/appointmentModel";
import { DoctorData } from "../../types/doctor";
import { BaseRepository } from "../BaseRepository";
import { UserDocument } from "../../types/user";
import { generateSlotsForDate } from "../../utils/slot.util";
import { SlotRuleType } from "../../types/slotRule";
import slotRuleModel from "../../models/slotRuleModel";

export class UserRepository
  extends BaseRepository<UserDocument>
  implements IUserRepository
{
  constructor() {
    super(userModel);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.findOne({ email });
  }

  async updatePasswordByEmail(
    email: string,
    newHashedPassword: string
  ): Promise<boolean> {
    const updatedUser = await userModel.findOneAndUpdate(
      { email },
      { $set: { password: newHashedPassword } }
    );
    return !!updatedUser;
  }

  async getAppointmentsByUserId(userId: string): Promise<AppointmentTypes[]> {
    // Return only confirmed appointments, both cancelled and not cancelled
    return appointmentModel.find({ userId, status: 'confirmed' }).sort({ date: -1 });
  }

  async findDoctorById(id: string): Promise<DoctorData | null> {
    return doctorModel.findById(id).select("-password") as any;
  }

  async cancelAppointment(
    userId: string,
    appointmentId: string
  ): Promise<void> {
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) throw new Error("Appointment not found");

    if (appointment.userId.toString() !== userId.toString()) {
      throw new Error("Unauthorized action");
    }

    if (appointment.cancelled) {
      throw new Error("Appointment already cancelled");
    }

    appointment.cancelled = true;
    await appointment.save();

   
  }

async findPayableAppointment(
  userId: string,
  appointmentId: string
): Promise<AppointmentDocument> {
  const appointment = await appointmentModel.findById<AppointmentDocument>(appointmentId);
  if (!appointment) throw new Error("Appointment not found");

  if (appointment.userId.toString() !== userId.toString()) {
    throw new Error("Unauthorized");
  }

  if (appointment.cancelled) throw new Error("Appointment cancelled");

  return appointment;
}


  async saveRazorpayOrderId(
    appointmentId: string,
    orderId: string
  ): Promise<void> {
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      razorpayOrderId: orderId,
    });
  }

  async markAppointmentPaid(appointmentId: string): Promise<void> {
    await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
  }

  async getAvailableSlotsByDoctorAndMonth(
  doctorId: string,
  year: number,
  month: number
): Promise<any[]> {
  const regexMonth = String(month).padStart(2, "0");
  const regex = new RegExp(`^${year}-${regexMonth}`); // e.g., /^2025-06/

  return slotRuleModel.find({
    doctorId,
    date: { $regex: regex },
    isCancelled: false,
    "slots.booked": false, 
  }).select("date slots");
}

}
