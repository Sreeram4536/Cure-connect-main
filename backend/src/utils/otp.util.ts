// export const generateOTP = (): string => {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// };


import { otpStore, OtpStoreData } from './otpStore';

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const isOtpExpired = (data: OtpStoreData): boolean => {
  return Date.now() > data.expiresAt;
};

export const validateOtp = (
  email: string,
  otp: string,
  purpose?: "register" | "reset-password"
): { valid: boolean; message?: string; data?: OtpStoreData } => {
  const record = otpStore.get(email);

  if (!record) {
    return { valid: false, message: "OTP not found or expired" };
  }

  if (isOtpExpired(record)) {
    // otpStore.delete(email);
    return { valid: false, message: "OTP has expired" };
  }

  if (purpose && record.purpose !== purpose) {
    return { valid: false, message: "Invalid OTP purpose" };
  }

  if (record.otp !== otp && record.otp !== "VERIFIED") {
    return { valid: false, message: "Invalid OTP" };
  }

  return { valid: true, data: record };
};