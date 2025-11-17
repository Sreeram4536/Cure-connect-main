interface CustomRequest extends Request {
  file?: Express.Multer.File;
}

export interface Address {
  line1: string;
  line2: string;
}

export interface DoctorData {
  _id?: string;
  name: string;
  email: string;
  image?: string;
  license?:string;
  password: string;
  speciality: string;
  degree: string;
  experience: string;
  about: string;
  available?: boolean;
  fees: number;
  address: Address;
  status?: "pending" | "approved" | "rejected"; 
  date?: Date;
  slots_booked?: {
    [date: string]: string[]; 
  };
  isBlocked?: boolean;
}

export interface DoctorDTO {
  name: string;
  email: string;
  password: string;
  speciality: string;
  degree: string;
  experience: string;
  about: string;
  fees: number;
  address: Address;
  imagePath?: string;
  licensePath?:string
  isBlocked?: boolean;
}

export type DoctorDocument = HydratedDocument<DoctorData>;


export interface DoctorProfileDTO {
  id: string;
  _id?: string; 
  name: string;
  email: string;
  image?: string;
  speciality: string;
  degree: string;
  experience: string;
  about: string;
  fees: number;
  address: Address;
  available?: boolean;
  status?: "pending" | "approved" | "rejected";
}

export interface DoctorListDTO {
  id: string;
  _id?: string; 
  name: string;
  email:string;
  image?: string;
  license?:string;
  address:Object;
  speciality: string;
  degree: string;
  experience: string;
  fees: number;
  available?: boolean;
  isBlocked?: boolean;
  status?: "pending" | "approved" | "rejected";
}

export type DoctorDocument = HydratedDocument<DoctorData>;

