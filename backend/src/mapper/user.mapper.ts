import { UserAuthDTO, UserProfileDTO } from "../dto/user.dto";
import { userData } from "../types/user";

  export const toUserAuthDTO=(user: userData & { _id: string }): UserAuthDTO =>{
    return {
      id: user._id?.toString() ?? "",
      name: user.name,
      email: user.email,
      image: user.image,
      isBlocked: !!user.isBlocked,
    };
  }

  export const toUserProfileDTO = (user: userData & { _id: string; createdAt?: Date; updatedAt?: Date }): UserProfileDTO =>{
    return {
      id: user._id?.toString() ?? "",
      name: user.name,
      email: user.email,
      image: user.image,
      address: user.address,
      gender: user.gender,
      dob: user.dob,
      phone: user.phone,
      isBlocked: !!user.isBlocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }