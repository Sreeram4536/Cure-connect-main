import { IUserRepository, PaginationResult } from "../../repositories/interface/IUserRepository";
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
import { releaseSlotLock } from "../../utils/slot.util";
import mongoose from "mongoose";

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
    console.log(`Getting all appointments for user: ${userId}`);
    const appointments = await appointmentModel.find({ userId }).sort({ date: -1 });
    console.log(`Found ${appointments.length} appointments for user ${userId}`);
    return appointments;
  }

  async getAppointmentsByUserIdPaginated(
    userId: string, 
    page: number, 
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    status?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<PaginationResult<AppointmentTypes>> {
    console.log(`Getting paginated appointments for user: ${userId}`, {
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      dateFrom,
      dateTo
    });
    
    const skip = (page - 1) * limit;
    
    // Base filter - show all appointments for the user
    const filterQuery: any = { userId };
    
    // Apply status filter if specified
    if (status && status !== 'all') {
      if (status === 'cancelled') {
        filterQuery.cancelled = true;
      } else if (status === 'active') {
        filterQuery.cancelled = false;
      } else if (status === 'confirmed') {
        filterQuery.status = 'confirmed';
      } else if (status === 'pending') {
        filterQuery.status = 'pending';
      }
    }
    
    // Apply date filters if specified
    if (dateFrom || dateTo) {
      filterQuery.slotDate = {};
      if (dateFrom) filterQuery.slotDate.$gte = dateFrom;
      if (dateTo) filterQuery.slotDate.$lte = dateTo;
    }
    
    console.log(`Filter query:`, filterQuery);
    
    let sortQuery: any = { date: -1 }; // default sort
    if (sortBy) {
      sortQuery = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    }
    
    const totalCount = await appointmentModel.countDocuments(filterQuery);
    const data = await appointmentModel.find(filterQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${totalCount} total appointments, returning ${data.length} for page ${page}`);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
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

    // Release the lock from doctor's slots_booked using utility
    const { docId, slotDate, slotTime } = appointment;
    const doctor = await doctorModel.findById(docId);
    if (doctor) {
      await releaseSlotLock(doctor, slotDate, slotTime);
    }
  }

async findPayableAppointment(
  userId: string,
  appointmentId: string
): Promise<AppointmentDocument> {
  try {
    console.log(`Finding payable appointment: ${appointmentId} for user: ${userId}`);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      console.log(`Invalid ObjectId: ${appointmentId}`);
      throw new Error("Invalid appointment ID");
    }
    
    const appointment = await appointmentModel.findById<AppointmentDocument>(appointmentId);
    if (!appointment) {
      console.log(`Appointment not found: ${appointmentId}`);
      throw new Error("Appointment not found");
    }

    console.log(`Found appointment:`, {
      appointmentId: appointment._id,
      userId: appointment.userId,
      requestedUserId: userId,
      cancelled: appointment.cancelled,
      payment: appointment.payment,
      amount: appointment.amount
    });

    if (appointment.userId.toString() !== userId.toString()) {
      console.log(`Unauthorized access attempt`);
      throw new Error("Unauthorized");
    }

    if (appointment.cancelled) {
      console.log(`Appointment already cancelled`);
      throw new Error("Appointment cancelled");
    }

    return appointment;
  } catch (error) {
    console.error(`Error in findPayableAppointment:`, error);
    throw error;
  }
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
