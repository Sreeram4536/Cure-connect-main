import express from "express";
import upload from "../middlewares/multer";
import authRole from "../middlewares/authRole";
import {slotLockController,userController} from "../dependencyhandler/user.dependency"
import { prescriptionController, feedbackController } from "../dependencyhandler/doctor.dependency";

const userRouter = express.Router();

userRouter.post("/register", userController.registerUser.bind(userController));
userRouter.post("/login", userController.loginUser.bind(userController));
userRouter.post("/otp/resend", userController.resendOtp.bind(userController));
userRouter.post("/otp/verify", userController.verifyOtp.bind(userController));
userRouter.post(
  "/password/forgot",
  userController.forgotPasswordRequest.bind(userController)
);
userRouter.post(
  "/password/reset",
  userController.resetPassword.bind(userController)
);
userRouter.post("/refresh-token", userController.refreshToken.bind(userController));
userRouter.post("/logout", userController.logout.bind(userController));
userRouter.get(
  "/profile",
  authRole(["user"]),
  userController.getProfile.bind(userController)
);
userRouter.put(
  "/profile",
  upload.single("image"),
  authRole(["user"]),
  userController.updateProfile.bind(userController)
);

userRouter.put(
  "/password/change",
  authRole(["user"]),
  userController.changePassword.bind(userController)
);
userRouter.post(
  "/appointments/initiate",
  authRole(["user"]),
  userController.initiatePayment.bind(userController)
);
userRouter.post(
  "/appointments/finalize",
  authRole(["user"]),
  userController.finalizeAppointment.bind(userController)
);
userRouter.get(
  "/appointments",
  authRole(["user"]),
  userController.listAppointmentPaginated.bind(userController)
);
userRouter.post(
  "/appointments/lock",
  authRole(["user"]),
  slotLockController.lockSlot.bind(slotLockController)
);

userRouter.patch(
  "/appointments/:appointmentId/cancel",
  authRole(["user"]),
  userController.cancelAppointment.bind(userController)
);

userRouter.patch(
  "/appointments/:appointmentId/cancel-lock",
  authRole(["user"]),
  slotLockController.cancelAppointment.bind(slotLockController)
);

userRouter.post(
  "/payments/razorpay",
  authRole(["user"]),
  userController.paymentRazorpay.bind(userController)
);
userRouter.post(
  "/payments/razorpay/verify",
  authRole(["user"]),
  userController.verifyRazorpay.bind(userController)
);


userRouter.get(
  "/doctor/:doctorId/slots",
  authRole(["user"]),
  userController.getAvailableSlotsForDoctor.bind(userController)
);

userRouter.get(
  "/doctor/:doctorId/slots/date",
  authRole(["user"]),
  userController.getAvailableSlotsForDate.bind(userController)
);

// Wallet routes
userRouter.get(
  "/wallet/balance",
  authRole(["user"]),
  userController.getWalletBalance.bind(userController)
);

userRouter.get(
  "/wallet/transactions",
  authRole(["user"]),
  userController.getWalletTransactions.bind(userController)
);

userRouter.get(
  "/wallet/details",
  authRole(["user"]),
  userController.getWalletDetails.bind(userController)
);

// Wallet payment routes
userRouter.post(
  "/appointments/wallet/payment",
  authRole(["user"]),
  userController.processWalletPayment.bind(userController)
);

userRouter.post(
  "/appointments/wallet/finalize",
  authRole(["user"]),
  userController.finalizeWalletPayment.bind(userController)
);

userRouter.post(
  "/wallet/validate-balance",
  authRole(["user"]),
  userController.validateWalletBalance.bind(userController)
);

export default userRouter;
// Feedback & Prescription (user)
userRouter.post(
  "/appointments/:appointmentId/feedback",
  authRole(["user"]),
  feedbackController.create.bind(feedbackController)
);
userRouter.get(
  "/appointments/:appointmentId/prescription",
  authRole(["user"]),
  prescriptionController.getByAppointment.bind(prescriptionController)
);
userRouter.get(
  "/prescriptions",
  authRole(["user"]),
  prescriptionController.listByUser.bind(prescriptionController)
);
