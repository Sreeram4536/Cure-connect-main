import { Request, Response } from "express";
import { IUserService } from "../../services/interface/IUserService";
import { HttpStatus } from "../../constants/status.constants";
import { HttpResponse } from "../../constants/responseMessage.constants";
import { IUserController } from "../interface/IuserController.interface";
import { otpStore } from "../../utils/otpStore";
import { sendOTP } from "../../utils/mail.util";
import { generateOTP } from "../../utils/otp.util";
import {
  isValidName,
  isValidEmail,
  isValidPassword,
} from "../../utils/validator";
import { PaymentService } from "../../services/implementation/PaymentService";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.utils";
import { log } from "console";
import { use } from "passport";
import { addTokenToBlacklist } from "../../utils/tokenBlacklist.util";
import jwt from "jsonwebtoken";
import appointmentModel from "../../models/appointmentModel";

export class UserController implements IUserController {
  constructor(
    private _userService: IUserService,
    private _paymentService: PaymentService
  ) {}

  async registerUser(req: Request, res: Response): Promise<void> {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: HttpResponse.FIELDS_REQUIRED });
      return;
    }

    if (!isValidName(name)) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: HttpResponse.INVALID_NAME });
      return;
    }

    if (!isValidEmail(email)) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: HttpResponse.INVALID_EMAIL });
      return;
    }

    if (!isValidPassword(password)) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: HttpResponse.INVALID_PASSWORD });
      return;
    }

    const existing = await this._userService.checkEmailExists(email);
    if (existing) {
      res
        .status(HttpStatus.CONFLICT)
        .json({ success: false, message: HttpResponse.EMAIL_ALREADY_EXISTS });
      return;
    }

    const hashed = await this._userService.hashPassword(password);
    const otp = generateOTP();
    console.log(otp);

    otpStore.set(email, {
      otp,
      purpose: "register",
      userData: { name, email, password: hashed },
    });

    try {
      await sendOTP(email, otp);
      res
        .status(HttpStatus.OK)
        .json({ success: true, message: HttpResponse.OTP_SENT });
    } catch (err) {
      console.error("Email send failed:", err);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: HttpResponse.OTP_SEND_FAILED });
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    const { email, otp } = req.body;

    const record = otpStore.get(email);
    if (!record || record.otp !== otp) {
      res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ success: false, message: HttpResponse.OTP_INVALID });
      return;
    }

    if (record.purpose === "register") {
      const newUser = await this._userService.finalizeRegister(record.userData);

  const token = generateAccessToken(newUser._id, newUser.email, "user");
  const refreshToken = generateRefreshToken(newUser._id);

  res.cookie("refreshToken_user", refreshToken, {
    httpOnly: true,
    path: "/api/user/refresh-token",
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  otpStore.delete(email);

  res.status(HttpStatus.CREATED).json({
    success: true,
    token,
    message: HttpResponse.REGISTER_SUCCESS,
  });
  return;
    }

    if (record.purpose === "reset-password") {
      otpStore.set(email, { ...record, otp: "VERIFIED" });
      res
        .status(HttpStatus.OK)
        .json({ success: true, message: HttpResponse.OTP_VERIFIED });
      return;
    }

    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ success: false, message: HttpResponse.BAD_REQUEST });
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const record = otpStore.get(email);

      if (!record) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json({ success: false, message: HttpResponse.OTP_NOT_FOUND });
        return;
      }

      const newOtp = generateOTP();
      console.log(newOtp);
      otpStore.set(email, { ...record, otp: newOtp });

      await sendOTP(email, newOtp);
      res
        .status(HttpStatus.OK)
        .json({ success: true, message: HttpResponse.OTP_RESENT });
    } catch (error) { 
      console.error("Resend OTP error:", error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: HttpResponse.OTP_SEND_FAILED });
    }
  }

  async forgotPasswordRequest(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    try {
      const user = await this._userService.checkEmailExists(email);
      if (!user) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json({ success: false, message: HttpResponse.USER_NOT_FOUND });
        return;
      }

      const otp = generateOTP();
      console.log(otp);
      otpStore.set(email, { otp, purpose: "reset-password", email });

      await sendOTP(email, otp);
      res
        .status(HttpStatus.OK)
        .json({ success: true, message: HttpResponse.RESET_EMAIL_SENT });
    } catch (err) {
      console.error("Error sending OTP:", err);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: HttpResponse.OTP_SEND_FAILED });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { email, newPassword } = req.body;

    if (!isValidPassword(newPassword)) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: HttpResponse.INVALID_PASSWORD });
      return;
    }

    const record = otpStore.get(email);
    if (
      !record ||
      record.purpose !== "reset-password" ||
      record.otp !== "VERIFIED"
    ) {
      res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ success: false, message: HttpResponse.OTP_EXPIRED_OR_INVALID });
      return;
    }

    const hashed = await this._userService.hashPassword(newPassword);
    const updated = await this._userService.resetPassword(email, hashed);

    if (!updated) {
      res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: HttpResponse.USER_NOT_FOUND });
      return;
    }

    otpStore.delete(email);
    res
      .status(HttpStatus.OK)
      .json({ success: true, message: HttpResponse.PASSWORD_UPDATED });
  }

  async loginUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: HttpResponse.FIELDS_REQUIRED });
        return;
      }

      if (!isValidEmail(email)) {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: HttpResponse.INVALID_EMAIL });
        return;
      }

      if (!isValidPassword(password)) {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: HttpResponse.INVALID_PASSWORD });
        return;
      }

      const { user, token, refreshToken } = await this._userService.login(
        email,
        password
      );

      res.cookie("refreshToken_user", refreshToken, {
        httpOnly: true,
        path: "/api/user/refresh-token",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res
        .status(HttpStatus.OK)
        .json({ success: true, token, message: HttpResponse.LOGIN_SUCCESS });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken_user;

      if (!refreshToken) {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .json({
            success: false,
            message: HttpResponse.REFRESH_TOKEN_MISSING,
          });
        return;
      }

      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .json({
            success: false,
            message: HttpResponse.REFRESH_TOKEN_INVALID,
          });
        return;
      }

const user = await this._userService.getUserById(decoded.id);
const newAccessToken = generateAccessToken(user._id, user.email, "user");
const newRefreshToken = generateRefreshToken(user._id);

      res.cookie("refreshToken_user", newRefreshToken, {
        httpOnly: true,
        path: "/api/user/refresh-token",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(HttpStatus.OK).json({ success: true, token: newAccessToken });
    } catch (error) {
      res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ success: false, message: HttpResponse.REFRESH_TOKEN_FAILED });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    // Blacklist the access token if present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded: any = jwt.decode(token);
        if (decoded && decoded.exp) {
          const expiresAt = new Date(decoded.exp * 1000);
          await addTokenToBlacklist(token, expiresAt);
        }
      } catch (e) {
        
      }
    }
    res.clearCookie("refreshToken_user", {
      httpOnly: true,
      path: "/api/user/refresh-token",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(HttpStatus.OK).json({
      success: true,
      message: HttpResponse.LOGOUT_SUCCESS,
    });
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userData = await this._userService.getProfile(userId);
      if (!userData) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json({ success: false, message: HttpResponse.USER_NOT_FOUND });
        return;
      }
      res.status(HttpStatus.OK).json({ success: true, userData });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      await this._userService.updateProfile(userId, req.body, req.file);
      res
        .status(HttpStatus.OK)
        .json({ success: true, message: HttpResponse.PROFILE_UPDATED });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async listAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const appointments = await this._userService.listUserAppointments(userId);
      res.status(HttpStatus.OK).json({ success: true, appointments });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      // console.log(userId)
      const { appointmentId } = req.params;
      // console.log(appointmentId);
      await this._userService.cancelAppointment(userId, appointmentId);
      res
        .status(HttpStatus.OK)
        .json({ success: true, message: HttpResponse.APPOINTMENT_CANCELLED });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async paymentRazorpay(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      // console.log(userId)
      if(!userId){
        console.log("user id required")
      }
      const { appointmentId } = req.body;
      // console.log(appointmentId)
          if (!appointmentId) {
            console.log("Ap id reqrd")
       res.status(400).json({ success: false, message: "Appointment ID is required" });
       return
    }

      const { order } = await this._userService.startPayment(
        userId,
        appointmentId
      );
      res.status(HttpStatus.OK).json({ success: true, order });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async verifyRazorpay(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { appointmentId, razorpay_order_id } = req.body;
      await this._userService.verifyPayment(
        userId,
        appointmentId,
        razorpay_order_id
      );
      res
        .status(HttpStatus.OK)
        .json({ success: true, message: HttpResponse.PAYMENT_SUCCESS });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async initiatePayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { docId, slotDate, slotTime } = req.body;
      console.log('initiatePayment received:', { userId, docId, slotDate, slotTime });
      // Get doctor info and fee
      const doctor = await this._userService.getDoctorById(docId);
      if (!doctor) {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Doctor not found' });
        return;
      }
      // Calculate amount (fee)
      const amount = doctor.fees;
      // Create payment order (do not create appointment yet)
      const shortReceipt = `${userId.toString().slice(-6)}-${docId.slice(-6)}-${Date.now()}`;
      const order = await this._paymentService.createOrder(amount * 100, shortReceipt);
      res.status(HttpStatus.OK).json({ success: true, order });
    } catch (error) {
      console.error('initiatePayment error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
    }
  }

  async finalizeAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { docId, slotDate, slotTime, payment } = req.body;
      // 1. Robustly verify payment with Razorpay
      if (!payment || !payment.razorpay_order_id || !payment.razorpay_payment_id || !payment.razorpay_signature) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Missing payment details' });
        return;
      }
      // Fetch order from Razorpay
      let orderInfo;
      try {
        orderInfo = await this._paymentService.fetchOrder(payment.razorpay_order_id);
      } catch (err) {
        console.error('Razorpay order fetch failed:', err);
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid Razorpay order ID' });
        return;
      }
      if (!orderInfo || orderInfo.status !== 'paid') {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Payment not completed or invalid order status' });
        return;
      }
      // Optionally: verify receipt format and content
      if (!orderInfo.receipt || typeof orderInfo.receipt !== 'string' || orderInfo.receipt.length > 40) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid receipt in Razorpay order' });
        return;
      }
      // 2. Create appointment if payment is valid
      const doctor = await this._userService.getDoctorById(docId);
      if (!doctor) {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Doctor not found' });
        return;
      }
      // Optionally: verify slot is still available
      const user = await this._userService.getUserById(userId);
      // 3. Confirm the pending appointment and mark as paid
      const appointment = await appointmentModel.findOneAndUpdate(
        {
          userId,
          docId,
          slotDate,
          slotTime,
          status: 'pending',
          cancelled: { $ne: true }
        },
        {
          $set: {
            payment: true,
            status: 'confirmed',
            lockExpiresAt: null,
            razorpayOrderId: payment.razorpay_order_id,
            date: new Date(),
          }
        },
        { new: true }
      );
      if (!appointment) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'No pending appointment found to confirm. It may have expired or been booked by another user.' });
        return;
      }
      res.status(HttpStatus.OK).json({ success: true, message: 'Appointment booked successfully' });
    } catch (error) {
      console.error('finalizeAppointment error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
    }
  }

  async getAvailableSlotsForDoctor(req: Request, res: Response): Promise<void> {
  try {
    const {year, month } = req.query;
    const { doctorId } = req.params;
    if (!doctorId || !year || !month) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: HttpResponse.FIELDS_REQUIRED,
      });
      return;
    }

    const slots = await this._userService.getAvailableSlotsForDoctor(
      String(doctorId),
      Number(year),
      Number(month)
    );

    res.status(HttpStatus.OK).json({ success: true, slots });
  } catch (error) {
    console.error("getAvailableSlotsForDoctor error:", error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch available slots",
    });
  }
}

  // New: Lock slot when user clicks 'Book Appointment'
  async lockSlot(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { docId, slotDate, slotTime } = req.body;
      const now = new Date();
      // Check if slot is already locked by another user (confirmed or pending and not expired)
      const blocking = await appointmentModel.findOne({
        docId,
        slotDate,
        slotTime,
        $or: [
          { status: 'confirmed' },
          { status: 'pending', lockExpiresAt: { $gt: now } }
        ]
      });
      if (blocking) {
        res.status(HttpStatus.CONFLICT).json({ success: false, message: 'Slot already locked or booked by another user' });
        return;
      }
      // Try to find a reusable appointment for this user/slot
      let appointment = await appointmentModel.findOne({
        userId,
        docId,
        slotDate,
        slotTime,
        $or: [
          { status: 'cancelled' },
          { status: 'pending', lockExpiresAt: { $lt: now } }
        ]
      });
      const user = await this._userService.getUserById(userId);
      const doctor = await this._userService.getDoctorById(docId);
      if (!user || !doctor) {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'User or doctor not found' });
        return;
      }
      if (appointment) {
        // Reuse: reset status, lockExpiresAt, etc.
        appointment.status = 'pending';
        appointment.cancelled = false;
        appointment.lockExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        appointment.date = new Date();
        appointment.userData = {
          name: user.name,
          email: user.email,
          phone: user.phone,
        };
        appointment.docData = {
          name: doctor.name,
          speciality: doctor.speciality,
          image: doctor.image,
        };
        appointment.amount = doctor.fees;
        await appointment.save();
      } else {
        // No reusable appointment, create new
        appointment = new appointmentModel({
          userId,
          docId,
          slotDate,
          slotTime,
          status: 'pending',
          lockExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
          date: new Date(),
          userData: {
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
          docData: {
            name: doctor.name,
            speciality: doctor.speciality,
            image: doctor.image,
          },
          amount: doctor.fees,
        });
        await appointment.save();
      }
      res.status(HttpStatus.OK).json({ success: true, message: 'Slot locked for payment', appointmentId: appointment._id });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
    }
  }

  // Instantly cancel a pending appointment lock (for payment cancel)
  async cancelLock(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { appointmentId } = req.params;
      const appointment = await appointmentModel.findById(appointmentId);
      if (!appointment) {
        res.status(404).json({ success: false, message: 'Appointment not found' });
        return;
      }
      if (appointment.userId.toString() !== userId.toString()) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }
      if (appointment.status !== 'pending' || appointment.cancelled) {
        res.status(400).json({ success: false, message: 'Cannot cancel: appointment is not pending or already cancelled' });
        return;
      }
      // Mark as cancelled so slot is instantly available
      appointment.cancelled = true;
      appointment.status = 'cancelled';
      await appointment.save();
      res.status(200).json({ success: true, message: 'Appointment lock cancelled' });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

}
