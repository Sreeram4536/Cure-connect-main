// export type OtpPurpose = "register" | "reset-password";

// export interface RegistrationOtpData {
//   otp: string;
//   purpose: "register";
//   userData: {
//     name: string;
//     email: string;
//     password: string;
//   };
// }

// export interface ForgotPasswordOtpData {
//   otp: string;
//   purpose: "reset-password";
//   email: string;
// }

// export type OtpStoreData = RegistrationOtpData | ForgotPasswordOtpData;

// export const otpStore = new Map<string, OtpStoreData>();

export type OtpPurpose = "register" | "reset-password";

export interface RegistrationOtpData {
  otp: string;
  purpose: "register";
  expiresAt: number; // Timestamp in milliseconds
  userData: {
    name: string;
    email: string;
    password: string;
  };
}

export interface ForgotPasswordOtpData {
  otp: string;
  purpose: "reset-password";
  expiresAt: number; // Timestamp in milliseconds
  email: string;
}

export type OtpStoreData = RegistrationOtpData | ForgotPasswordOtpData;

export const otpStore = new Map<string, OtpStoreData>();

// OTP expiry duration in milliseconds (1 minute)
export const OTP_EXPIRY_DURATION = 1 * 60 * 1000;

// Cleanup expired OTPs periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (data.expiresAt < now-(30 * 60 * 1000)) {
      otpStore.delete(email);
      console.log(`Expired OTP removed for: ${email}`);
    }
  }
}, 30 * 60 * 1000);
