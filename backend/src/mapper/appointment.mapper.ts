import { AppointmentDTO } from "../dto/appointment.dto";
import { AppointmentTypes } from "../types/appointment";

type AppointmentWithId = AppointmentTypes & { _id?: string };

export const toAppointmentDTO=(a: AppointmentWithId): AppointmentDTO =>{
    return {
      id: a._id?.toString() ?? "",
      _id: a._id?.toString() ?? "",
      userId: String(a.userId),
      docId: String(a.docId),
      slotDate: a.slotDate,
      slotTime: a.slotTime,
      amount: a.amount,
      date: a.date,
      cancelled: a.cancelled,
      payment: a.payment,
      status: a.status,
      isConfirmed: a.isConfirmed,
      isCompleted: a.isCompleted,
      userData: a.userData,
      docData: a.docData,
      razorpayOrderId:a.razorpayOrderId?.toString() ?? ""
    };
  }

  
