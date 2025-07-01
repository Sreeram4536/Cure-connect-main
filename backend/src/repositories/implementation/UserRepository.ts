import { IUserRepository } from "../../repositories/interface/IUserRepository";
import userModel from "../../models/userModel";
import doctorModel from "../../models/doctorModel";
// import slotModel from "../../models/slotModel";
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

  async bookAppointment(appointmentData: AppointmentTypes): Promise<void> {
    const { userId, docId, slotDate, slotTime } = appointmentData;

    // const existingappointment = await appointmentModel.countDocuments({
    //   userId,docId
    // })
    // if(existingappointment>=2){
      
    // }

    // Check doctor availability
    const doctor = await doctorModel.findById(docId);
    if (!doctor || !doctor.available) throw new Error("Doctor not available");

   // 1. Get the doctor's slot rule
const slotRuleModel = require("../../models/slotRuleModel").default; // adjust import if needed
const rule = await slotRuleModel.findOne({ doctorId: docId });
if (!rule) throw new Error("No slot rule set for this doctor");

// 2. Generate slots for the requested date using the rule
const slots = generateSlotsForDate(rule as SlotRuleType, slotDate); // implement this utility

// 3. Check if the requested slotTime is in the generated slots
const slot = slots.find(s => s.start === slotTime);
if (!slot) throw new Error("Slot not available");

// 4. Check if the slot is already booked (check appointments for this doctor/date/slotTime)
const alreadyBooked = await appointmentModel.findOne({ docId, slotDate, slotTime, cancelled: { $ne: true } });
if (alreadyBooked) throw new Error("Slot already booked");

// 5. Proceed to book the appointment as before

    // Prepare user and doctor data
    const userData = await userModel.findById(userId).select("-password");
    const docData = await doctorModel.findById(docId).select("-password");

    const appointment = new appointmentModel({
      userId,
      docId,
      userData,
      docData,
      amount: docData!.fees,
      slotTime,
      slotDate,
      date: new Date(),
    });

    await appointment.save();
  }

  async getAppointmentsByUserId(userId: string): Promise<AppointmentTypes[]> {
    return appointmentModel.find({ userId }).sort({ date: -1 });
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

    // // Unmark the slot as booked in slotModel
    // const { docId, slotDate, slotTime } = appointment;
    // const slotDoc = await slotModel.findOne({ doctorId: docId, date: slotDate });
    // if (slotDoc) {
    //   const slotIndex = slotDoc.slots.findIndex(
    //     (slot) => slot.start === slotTime && slot.booked
    //   );
    //   if (slotIndex !== -1) {
    //     slotDoc.slots[slotIndex].booked = false;
    //     await slotDoc.save();
    //   }
    // }
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
    "slots.booked": false, // Only include if you want at least one unbooked slot
  }).select("date slots");
}

}
