// repositories/impl/AdminRepository.ts

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

export class AdminRepository extends BaseRepository<AdminDocument> {
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

  async getDoctorsPaginated(page: number, limit: number): Promise<PaginationResult<Omit<DoctorData, "password">>> {
    const skip = (page - 1) * limit;
    const totalCount = await doctorModel.countDocuments({});
    const data = await doctorModel.find({}).select("-password").skip(skip).limit(limit);
    
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

  async getAllUsers(): Promise<Omit<userData, "password">[]> {
    return userModel.find({}).select("-password");
  }

  async getUsersPaginated(page: number, limit: number): Promise<PaginationResult<Omit<userData, "password">>> {
    const skip = (page - 1) * limit;
    const totalCount = await userModel.countDocuments({});
    const data = await userModel.find({}).select("-password").skip(skip).limit(limit);
    
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

  async getAppointmentsPaginated(page: number, limit: number): Promise<PaginationResult<AppointmentTypes>> {
    const skip = (page - 1) * limit;
    const totalCount = await appointmentModel.countDocuments({});
    const data = await appointmentModel.find({})
      .populate({ path: 'userId', select: 'name email image dob', model: 'user' })
      .populate({ path: 'docId', select: 'name image speciality', model: 'doctor' })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
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
}
