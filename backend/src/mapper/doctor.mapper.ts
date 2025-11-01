import { DoctorListDTO, DoctorProfileDTO } from "../dto/doctor.dto";
import { DoctorData } from "../types/doctor";

 export const toDoctorProfileDTO=(doc: Partial<DoctorData>): DoctorProfileDTO => {
    return {
      id: doc._id?.toString() ?? "",
      _id: doc._id?.toString() ?? "",
      name: doc.name ?? "",
      email: doc.email ?? "",
      image: doc.image ?? "",
      speciality: doc.speciality ?? "",
      degree: doc.degree ?? "",
      experience: doc.experience ?? "",
      about: doc.about ?? "",
      fees: doc.fees ?? 0,
      address: doc.address ?? { line1: "", line2: "" },
      available: doc.available ?? false,
      status: doc.status ?? "pending",
    };
  }

   export const toDoctorListDTO = (doc: Partial<DoctorData>): DoctorListDTO => {
      return {
        id: doc._id?.toString() ?? "",
        _id: doc._id?.toString() ?? "",
        name: doc.name ?? "",
        image: doc.image ?? "",
        speciality: doc.speciality ?? "",
        degree: doc.degree ?? "",
        experience: doc.experience ?? "",
        fees: doc.fees ?? 0,
        available: doc.available ?? false,
        isBlocked: doc.isBlocked ?? false,
        status: doc.status ?? "pending",
      };
    }
