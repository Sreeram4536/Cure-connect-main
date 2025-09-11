import { BaseRepository } from "../BaseRepository";
import appointmentModel from "../../models/appointmentModel";
import doctorModel from "../../models/doctorModel";
import { AppointmentTypes } from "../../types/appointment";
import { DoctorData, DoctorDocument } from "../../types/doctor";
import { IDoctorRepository, PaginationResult } from "../interface/IDoctorRepository";
import { releaseSlotLock } from "../../utils/slot.util";
import mongoose from "mongoose";

export class DoctorRepository
  extends BaseRepository<DoctorDocument>
  implements IDoctorRepository
{
  constructor() {
    super(doctorModel);
  }

  async registerDoctor(data: DoctorData): Promise<DoctorDocument> {
    return doctorModel.create(data);
  }

  async findByEmail(email: string): Promise<DoctorData | null> {
    return this.findOne({ email });
  }

  async save(doctor: DoctorDocument): Promise<void> {
    await doctor.save();
  }

  async updateAvailability(id: string, available: boolean): Promise<void> {
    await this.updateById(id, { available });
  }

  async findAllDoctors(): Promise<Partial<DoctorData>[]> {
    return doctorModel.find({}).select("-password -email");
  }

  async findAppointmentsByDoctorId(docId: string): Promise<AppointmentTypes[]> {
    return appointmentModel.find({ docId });
  }

  async findAppointmentById(id: string): Promise<AppointmentTypes | null> {
    return appointmentModel.findById(id);
  }

  async findPayableAppointment(
    docId: string,
    appointmentId: string
  ): Promise<AppointmentTypes> {
    try {
      console.log(`Finding payable appointment: ${appointmentId} for doctor: ${docId}`);
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        console.log(`Invalid ObjectId: ${appointmentId}`);
        throw new Error("Invalid appointment ID");
      }
      const appointment = await appointmentModel.findById<AppointmentTypes>(appointmentId);
      if (!appointment) {
        console.log(`Appointment not found: ${appointmentId}`);
        throw new Error("Appointment not found");
      }
      console.log(`Found appointment:`, {
        appointmentId: (appointment as any)._id,
        docId: appointment.docId,
        requestedDocId: docId,
        cancelled: appointment.cancelled,
        payment: appointment.payment,
        amount: appointment.amount
      });
      if (appointment.docId.toString() !== docId.toString()) {
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

  async markAppointmentAsConfirmed(id: string): Promise<void> {
    await appointmentModel.findByIdAndUpdate(id, { isConfirmed: true });
  }

  async cancelAppointment(id: string): Promise<void> {
    const appointment = await appointmentModel.findById(id);
    if (!appointment) throw new Error("Appointment not found");
    appointment.cancelled = true;
    await appointment.save();
    // Release the lock from doctor's slots_booked using utility
    const { docId, slotDate, slotTime } = appointment;
    const doctor = await doctorModel.findById(docId);
    if (doctor) {
      await releaseSlotLock(doctor, slotDate, slotTime);
    }
  }

   async getDoctorsPaginated(page: number, limit: number, speciality?: string, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<PaginationResult<Partial<DoctorData>>> {
    const skip = (page - 1) * limit;
    const query: any = { status: "approved" };
    if (speciality) {
      query.speciality = speciality;
    }
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    let sort: any = { _id: 1 };
    if (sortBy === 'experience') {
      sort = { experience: sortOrder === 'desc' ? -1 : 1, _id: 1 };
    } else if (sortBy === 'fees') {
      sort = { fees: sortOrder === 'desc' ? -1 : 1, _id: 1 };
    }
    const totalCount = await doctorModel.countDocuments(query);
    const data = await doctorModel.find(query).select("-password").sort(sort).skip(skip).limit(limit);
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


 async getAppointmentsPaginated(docId: string, page: number, limit: number, search?: string): Promise<PaginationResult<AppointmentTypes>> {
    const skip = (page - 1) * limit;
    const query: any = { docId };
    if (search) {
      // Find user IDs matching the search
      const userModel = (await import("../../models/userModel")).default;
      const userIds = await userModel.find({ name: { $regex: search, $options: "i" } }).select("_id");
      query.userId = { $in: userIds.map((u: any) => u._id) };
    }
    const totalCount = await appointmentModel.countDocuments(query);
    const data = await appointmentModel.find(query)
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

  async getDoctorProfileById(id: string): Promise<DoctorData | null> {
    return doctorModel.findById(id).select("-password");
  }

  async updateDoctorProfile(
    id: string,
    updateData: Partial<
      Pick<
        DoctorData,
        | "name"
        | "speciality"
        | "degree"
        | "experience"
        | "about"
        | "fees"
        | "address"
        | "image"
      >
    >
  ): Promise<void> {
    await this.updateById(id, updateData);
  }

  async getDoctorsByStatusAndLimit(status: string, limit: number): Promise<Partial<DoctorData>[]> {
    return doctorModel.find({ status }).limit(limit).select("-password -email");
  }

  async updateById(id: string, updateData: Partial<DoctorData>): Promise<void> {
    await doctorModel.findByIdAndUpdate(id, updateData);
  }
}