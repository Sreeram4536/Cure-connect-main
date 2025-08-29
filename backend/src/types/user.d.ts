export interface Address {
  line1: string;
  line2: string;
}

export interface userData {
  
  name: string;
  email: string;
  image: string;
  password: string;
  address: Address;
  gender: string;
  dob: string;
  phone: string;
  isBlocked: boolean;
  googleId?: string;
}


export type UserDocument = HydratedDocument<userData>;

// DTOs returned to clients (no password)
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

export interface UserAuthDTO {
  id: string;
  name: string;
  email: string;
  image?: string;
  isBlocked: boolean;
}
