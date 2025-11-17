export interface Address {
  line1: string;
  line2: string;
}

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
  email:string,
  license?:string,
  address:string,
  image?: string;
  speciality: string;
  degree: string;
  experience: string;
  fees: number;
  available?: boolean;
  isBlocked?: boolean;
  status?: "pending" | "approved" | "rejected";
  about:string;
  
}