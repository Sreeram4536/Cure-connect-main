import {
  ISlotLockService,
  LockSlotParams,
  AppointmentIdParam,
} from "../interface/ISlotLockService";
import { IAppointmentRepository } from "../../repositories/interface/IAppointmentRepository";
import { IUserRepository } from "../../repositories/interface/IUserRepository";
import { IDoctorRepository } from "../../repositories/interface/IDoctorRepository";
import { HttpResponse } from "../../constants/responseMessage.constants";
import { AppointmentTypes } from "../../types/appointment";

export class SlotLockService implements ISlotLockService {
  constructor(
    private appointmentRepo: IAppointmentRepository,
    private userRepo: IUserRepository,
    private doctorRepo: IDoctorRepository
  ) {}

  async lockSlot({ userId, docId, slotDate, slotTime }: LockSlotParams) {
    const now = new Date();
    const conflict = await this.appointmentRepo.findBySlot(
      docId,
      slotDate,
      slotTime
    );
    if (
      conflict &&
      !conflict.cancelled &&
      (conflict.status === "confirmed" ||
        (conflict.status === "pending" &&
          conflict.lockExpiresAt &&
          conflict.lockExpiresAt > now))
    ) {
      return { success: false, message: HttpResponse.SLOT_ALREADY_BOOKED };
    }
    const user = await this.userRepo.findById(userId);
    const doctor = await this.doctorRepo.findById(docId);
    if (!user || !doctor) {
      return { success: false, message: HttpResponse.USER_OR_DOCTOR_NOT_FOUND };
    }
    let appointment = await this.appointmentRepo.findUserDoctor(
      userId,
      docId,
      slotDate,
      slotTime
    );
    const userData = { name: user.name, email: user.email, phone: user.phone };
    const docData = {
      name: doctor.name,
      speciality: doctor.speciality,
      image: doctor.image,
    };
    const amount = doctor.fees;
    if (
      appointment &&
      (appointment.status === "cancelled" ||
        (appointment.status === "pending" &&
          appointment.lockExpiresAt &&
          appointment.lockExpiresAt < now))
    ) {
      appointment = await this.appointmentRepo.updateAppointment(
        appointment._id.toString(),
        {
          status: "pending",
          cancelled: false,
          lockExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
          date: new Date(),
          userData,
          docData,
          amount,
        }
      );
    } else if (!appointment) {
      appointment = await this.appointmentRepo.createAppointment({
        userId,
        docId,
        slotDate,
        slotTime,
        status: "pending",
        lockExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        date: new Date(),
        userData,
        docData,
        amount,
      });
    }
    if (!appointment) {
      return {
        success: false,
        message: "Failed to create or update appointment",
      };
    }
    return { success: true, appointmentId: appointment._id.toString() };
  }

  async releaseSlot({ appointmentId }: AppointmentIdParam) {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment)
      return { success: false, message: HttpResponse.APPOINTMENT_NOT_FOUND };
    await this.appointmentRepo.updateAppointment(appointmentId, {
      status: "cancelled",
      cancelled: true,
    });
    const doctor = await this.doctorRepo.findById(appointment.docId);
    if (
      doctor &&
      doctor.slots_booked &&
      doctor.slots_booked[appointment.slotDate]
    ) {
      doctor.slots_booked[appointment.slotDate] = doctor.slots_booked[
        appointment.slotDate
      ].filter((t: string) => t !== appointment.slotTime);
      if (doctor.slots_booked[appointment.slotDate].length === 0)
        delete doctor.slots_booked[appointment.slotDate];
      if (typeof this.doctorRepo.updateById === "function") {
        if (!doctor._id || typeof doctor._id !== "string") {
          return { success: false, message: "Doctor ID is missing or invalid" };
        }
        await this.doctorRepo.updateById(doctor._id, {
          slots_booked: doctor.slots_booked,
        });
      }
    }
    return { success: true, message: HttpResponse.SLOT_RELEASED };
  }

  async confirmAppointment({ appointmentId }: AppointmentIdParam) {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment || appointment.status !== "pending")
      return { success: false, message: HttpResponse.APPOINTMENT_NOT_FOUND };
    await this.appointmentRepo.updateAppointment(appointmentId, {
      status: "confirmed",
      isConfirmed: true,
      cancelled: false,
    });
    const doctor = await this.doctorRepo.findById(appointment.docId);
    if (doctor) {
      if (!doctor.slots_booked) doctor.slots_booked = {};
      if (!doctor.slots_booked[appointment.slotDate])
        doctor.slots_booked[appointment.slotDate] = [];
      doctor.slots_booked[appointment.slotDate].push(appointment.slotTime);
      if (typeof this.doctorRepo.updateById === "function") {
        if (!doctor._id || typeof doctor._id !== "string") {
          return { success: false, message: "Doctor ID is missing or invalid" };
        }
        await this.doctorRepo.updateById(doctor._id, {
          slots_booked: doctor.slots_booked,
        });
      }
    }
    return { success: true, message: HttpResponse.APPOINTMENT_CONFIRMED };
  }

  async cancelAppointment({ appointmentId }: AppointmentIdParam) {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment)
      return { success: false, message: HttpResponse.APPOINTMENT_NOT_FOUND };
    await this.appointmentRepo.updateAppointment(appointmentId, {
      status: "cancelled",
      cancelled: true,
    });
    const doctor = await this.doctorRepo.findById(appointment.docId);
    if (
      doctor &&
      doctor.slots_booked &&
      doctor.slots_booked[appointment.slotDate]
    ) {
      doctor.slots_booked[appointment.slotDate] = doctor.slots_booked[
        appointment.slotDate
      ].filter((t: string) => t !== appointment.slotTime);
      if (doctor.slots_booked[appointment.slotDate].length === 0)
        delete doctor.slots_booked[appointment.slotDate];
      if (typeof this.doctorRepo.updateById === "function") {
        if (!doctor._id || typeof doctor._id !== "string") {
          return { success: false, message: "Doctor ID is missing or invalid" };
        }
        await this.doctorRepo.updateById(doctor._id, {
          slots_booked: doctor.slots_booked,
        });
      }
    }
    return { success: true, message: HttpResponse.APPOINTMENT_CANCELLED };
  }
}
