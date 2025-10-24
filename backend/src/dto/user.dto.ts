import { Address } from "../types/user";

export interface UserAuthDTO {
  id: string;
  name: string;
  email: string;
  image?: string;
  isBlocked: boolean;
}

export interface UserProfileDTO {
  id: string;
  _id?: string; // backward-compat for frontend
  name: string;
  email: string;
  image?: string;
  address?: Address;
  gender?: string;
  dob?: string;
  phone?: string;
  isBlocked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}