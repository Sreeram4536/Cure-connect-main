import express from "express";
import { UserController } from "../controllers/implementation/UserController";
import { UserService } from "../services/implementation/UserService";
import { UserRepository } from "../repositories/implementation/UserRepository";
import upload from "../middlewares/multer";
import { PaymentService } from "../services/implementation/PaymentService";
import authRole from "../middlewares/authRole";

const userRepository = new UserRepository();
const paymentService = new PaymentService();
const userService = new UserService(userRepository, paymentService);
const userController = new UserController(userService, paymentService);

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
  userController.listAppointment.bind(userController)
);
userRouter.post(
  "/appointments/lock",
  authRole(["user"]),
  userController.lockSlot.bind(userController)
);

userRouter.patch(
  "/appointments/:appointmentId/cancel",
  authRole(["user"]),
  userController.cancelAppointment.bind(userController)
);

userRouter.patch(
  "/appointments/:appointmentId/cancel-lock",
  authRole(["user"]),
  userController.cancelLock.bind(userController)
);

// userRouter.get(
//   "/appointments/paginated",
//   authRole(["user"]),
//   userController.appointmentsUserPaginated.bind(userController)
// );

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

// userRouter.get(
//   "/available-slots",
//   authRole(["user"]),
//   userController.getAvailableSlotsForDoctor.bind(userController)
// );

userRouter.get(
  "/doctor/:doctorId/slots",
  authRole(["user"]),
  userController.getAvailableSlotsForDoctor.bind(userController)
);

export default userRouter;
