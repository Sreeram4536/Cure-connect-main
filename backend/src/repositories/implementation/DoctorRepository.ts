import { BaseRepository } from "../BaseRepository";
import appointmentModel from "../../models/appointmentModel";
import doctorModel from "../../models/doctorModel";
import { AppointmentTypes } from "../../types/appointment";
import { DoctorData, DoctorDocument } from "../../types/doctor";
import { IDoctorRepository, PaginationResult } from "../interface/IDoctorRepository";

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

  async markAppointmentAsConfirmed(id: string): Promise<void> {
    await appointmentModel.findByIdAndUpdate(id, { isConfirmed: true });
  }

  async cancelAppointment(id: string): Promise<void> {
    await appointmentModel.findByIdAndUpdate(id, { cancelled: true });
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


 async getAppointmentsPaginated(docId: string, page: number, limit: number): Promise<PaginationResult<AppointmentTypes>> {
    const skip = (page - 1) * limit;
    const totalCount = await appointmentModel.countDocuments({ docId });
    const data = await appointmentModel.find({ docId })
      .populate('userId', 'name email image dob')
      .populate('docId', 'name image speciality')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
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
}