
import { IAdminRepository, PaginationResult } from "../interface/IAdminRepository";
import { BaseRepository } from "../BaseRepository";
import adminModel from "../../models/adminModel";
import doctorModel from "../../models/doctorModel";
import userModel from "../../models/userModel";
import appointmentModel from "../../models/appointmentModel";
import { DoctorData } from "../../types/doctor";
import { userData } from "../../types/user";
import { AdminDocument } from "../../types/admin";
import { AppointmentDocument, AppointmentTypes } from "../../types/appointment";
import { releaseSlotLock } from "../../utils/slot.util";
import mongoose from "mongoose";

export class AdminRepository extends BaseRepository<AdminDocument> implements IAdminRepository{
  constructor() {
    super(adminModel);
  }

  async findByEmail(email: string): Promise<AdminDocument | null> {
    return this.findOne({ email });
  }

  async findAdminById(id: string): Promise<AdminDocument | null> {
     return this.findById(id)
  }

  async saveDoctor(data: DoctorData): Promise<void> {
    const newDoctor = new doctorModel(data);
    await newDoctor.save();
  }

  async getAllDoctors(): Promise<Omit<DoctorData, "password">[]> {
    return doctorModel.find({}).select("-password");
  }

  async getDoctorsPaginated(page: number, limit: number, search?: string): Promise<PaginationResult<Omit<DoctorData, "password">>> {
    const skip = (page - 1) * limit;
    let query = {};
    if (search && search.trim()) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { speciality: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const totalCount = await doctorModel.countDocuments(query);
    const data = await doctorModel.find(query).select("-password").skip(skip).limit(limit).sort({ date: -1 });;
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

  
   async getAllUsers(search?: string): Promise<Omit<userData, "password">[]> {
    let query = {};
    
    if (search && search.trim()) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    return userModel.find(query).select("-password");
  }

  async getUsersPaginated(page: number, limit: number, search?: string): Promise<PaginationResult<Omit<userData, "password">>> {
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (search && search.trim()) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const totalCount = await userModel.countDocuments(query);
    const data = await userModel.find(query).select("-password").skip(skip).limit(limit).sort({ createdAt: -1 });
    
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

  async toggleUserBlock(userId: string,block:boolean): Promise<string> {
    console.log("user id to block",userId);
    
    const user = await userModel.findById(userId);
    if (!user) throw new Error("User not found");

    // user.isBlocked = !user.isBlocked;
    user.isBlocked=block
    await user.save();

    return user.isBlocked ? "User blocked" : "User unblocked";
  }

  async toggleDoctorBlock(doctorId: string, block: boolean): Promise<string> {
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) throw new Error("Doctor not found");
    doctor.isBlocked = block;
    await doctor.save();
    return doctor.isBlocked ? "Doctor blocked" : "Doctor unblocked";
  }

  async getAllAppointments(): Promise<AppointmentDocument[]> {
    return appointmentModel.find({});
  }

  async getAppointmentsPaginated(page: number, limit: number, search?: string, sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): Promise<PaginationResult<AppointmentTypes>> {
    const skip = (page - 1) * limit;
    let query: any = {};
    if (search && search.trim()) {
      query = {
        $or: [
          { 'userData.name': { $regex: search, $options: 'i' } },
          { 'docData.name': { $regex: search, $options: 'i' } }
        ]
      };
    }
    const totalCount = await appointmentModel.countDocuments(query);
    const data = await appointmentModel.find(query)
      .populate({ path: 'userId', select: 'name email image dob', model: 'user' })
      .populate({ path: 'docId', select: 'name image speciality', model: 'doctor' })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });
    data.forEach((appt: any) => {
      if (appt.userId) {
        if (!appt.userData) {
          appt.userData = {
            name: appt.userId.name,
            email: appt.userId.email,
            image: appt.userId.image,
            dob: appt.userId.dob,
          };
        } else {
          if (!appt.userData.image) appt.userData.image = appt.userId.image;
          if (!appt.userData.dob) appt.userData.dob = appt.userId.dob;
        }
      }
      if (appt.docId) {
        if (!appt.docData) {
          appt.docData = {
            name: appt.docId.name,
            image: appt.docId.image,
            speciality: appt.docId.speciality,
          };
        } else {
          if (!appt.docData.image) appt.docData.image = appt.docId.image;
          if (!appt.docData.speciality) appt.docData.speciality = appt.docId.speciality;
        }
      }
    });
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

  async cancelAppointment(appointmentId: string): Promise<void> {
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) throw new Error("Appointment not found");

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

  async getAppointmentById(appointmentId: string): Promise<AppointmentDocument | null> {
    return appointmentModel.findById(appointmentId);
  }

  async findPayableAppointment(
    appointmentId: string
  ): Promise<AppointmentDocument> {
    try {
      console.log(`Finding payable appointment: ${appointmentId} for admin`);
      
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
        cancelled: appointment.cancelled,
        payment: appointment.payment,
        amount: appointment.amount
      });

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

  async findFirstAdmin(): Promise<AdminDocument | null> {
    return adminModel.findOne().lean() as any;
  }
}
