import { PrescriptionDTO } from "../dto/prescription.dto";

 export const toPrescriptionDTO=(prescription: any): PrescriptionDTO => {
    return {
      id: prescription._id.toString(),
      appointmentId: prescription.appointmentId,
      doctorId:
        typeof prescription.doctorId === "object"
          ? prescription.doctorId._id?.toString()
          : prescription.doctorId.toString(),
      userId:
        typeof prescription.userId === "object"
          ? prescription.userId._id?.toString()
          : prescription.userId.toString(),
      doctor:
        prescription.doctorId && typeof prescription.doctorId === "object"
          ? {
              name: prescription.doctorId.name,
              specialization: prescription.doctorId.speciality,
            }
          : undefined,
      patient:
        prescription.userId && typeof prescription.userId === "object"
          ? {
              name: prescription.userId.name,
              dob: prescription.userId.dob,
              gender: prescription.userId.gender,
            }
          : undefined,
      items: prescription.items,
      notes: prescription.notes,
      createdAt: prescription.createdAt,
    };
  }