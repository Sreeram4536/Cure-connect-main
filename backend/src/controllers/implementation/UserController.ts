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
import { IPaymentService } from "../../services/interface/IPaymentService";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.utils";
import { addTokenToBlacklist } from "../../utils/tokenBlacklist.util";
import jwt from "jsonwebtoken";
import appointmentModel from "../../models/appointmentModel";
import { AuthRequest, JwtPayloadExt } from "../../types/customRequest";

export class UserController implements IUserController {
  constructor(
    private _userService: IUserService,
    private _paymentService: IPaymentService
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
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge : Number(process.env.COOKIE_MAX_AGE),
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
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge : Number(process.env.COOKIE_MAX_AGE), // 7 days
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
const newRefreshToken = generateRefreshToken(user._id, "user");

      res.cookie("refreshToken_user", newRefreshToken, {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge : Number(process.env.COOKIE_MAX_AGE), // 7 days
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
        const decoded = jwt.decode(token) as JwtPayloadExt | null;
        if (decoded && decoded.exp) {
          const expiresAt = new Date(decoded.exp * 1000);
          await addTokenToBlacklist(token, expiresAt);
        }
      } catch (e) {
        
      }
    }
    res.clearCookie("refreshToken_user", {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });
    res.status(HttpStatus.OK).json({
      success: true,
      message: HttpResponse.LOGOUT_SUCCESS,
    });
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "User ID not found" });
        return;
      }
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

  
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Current and new password are required.' });
        return;
      }
      if (!isValidPassword(newPassword)) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: HttpResponse.INVALID_PASSWORD });
        return;
      }
      const result = await this._userService.changePassword(userId, currentPassword, newPassword);
      if (result.success) {
        res.status(HttpStatus.OK).json({ success: true, message: 'Password updated successfully.' });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: result.message });
      }
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
    }
  }

 
  async listAppointmentPaginated(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc';
      const status = req.query.status as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      console.log(`ListAppointmentPaginated called with:`, {
        userId,
        page,
        limit,
        sortBy,
        sortOrder,
        status,
        dateFrom,
        dateTo
      });

      if (page && limit) {
        console.log(`Calling paginated appointments`);
        const result = await this._userService.listUserAppointmentsPaginated(
          userId,
          page,
          limit,
          sortBy,
          sortOrder,
          status,
          dateFrom,
          dateTo
        );
        console.log(`Paginated result:`, { 
          totalCount: result.totalCount, 
          dataLength: result.data.length,
          currentPage: result.currentPage,
          totalPages: result.totalPages
        });
        res.status(HttpStatus.OK).json({ success: true, ...result });
      } else {
        console.log(`Calling non-paginated appointments`);
        const appointments = await this._userService.listUserAppointments(userId);
        console.log(`Non-paginated result:`, { 
          appointmentsLength: appointments.length 
        });
        res.status(HttpStatus.OK).json({ success: true, data: appointments });
      }
    } catch (error) {
      console.error(`Error in listAppointmentPaginated:`, error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
     
      const { appointmentId } = req.params;
      
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
       res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Appointment ID is required" });
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
      const { docId, slotDate, slotTime, appointmentId } = req.body;
      console.log('initiatePayment received:', { userId, docId, slotDate, slotTime });
      
      const doctor = await this._userService.getDoctorById(docId);
      if (!doctor) {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Doctor not found' });
        return;
      }
      
      const amount = doctor.fees;
      // Use appointmentId as receipt so verifyPayment can match order.receipt === appointmentId
      if (!appointmentId) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'appointmentId is required' });
        return;
      }
      const order = await this._paymentService.createOrder(amount * 100, appointmentId);
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
      
      if (!orderInfo.receipt || typeof orderInfo.receipt !== 'string' || orderInfo.receipt.length > 40) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid receipt in Razorpay order' });
        return;
      }
      
      const doctor = await this._userService.getDoctorById(docId);
      if (!doctor) {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Doctor not found' });
        return;
      }
      
      const user = await this._userService.getUserById(userId);
      
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

  async getAvailableSlotsForDate(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;
      const { doctorId } = req.params;
      
      if (!doctorId || !date) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: HttpResponse.FIELDS_REQUIRED,
        });
        return;
      }

      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(String(date))) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
        });
        return;
      }

      const slots = await this._userService.getAvailableSlotsForDate(
        String(doctorId),
        String(date)
      );

      res.status(HttpStatus.OK).json({ success: true, slots });
    } catch (error) {
      console.error("getAvailableSlotsForDate error:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch available slots for date",
      });
    }
  }

  async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "User not authenticated" });
        return;
      }

      const balance = await this._userService.getWalletBalance(userId);
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: { balance },
        message: "Wallet balance retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get wallet balance"
      });
    }
  }

  async getWalletTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "User not authenticated" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const transactions = await this._userService.getWalletTransactions(
        userId,
        page,
        limit,
        sortBy,
        sortOrder
      );

      res.status(HttpStatus.OK).json({
        success: true,
        data: transactions,
        message: "Wallet transactions retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting wallet transactions:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get wallet transactions"
      });
    }
  }

  async getWalletDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const walletDetails = await this._userService.getWalletDetails(userId);
      res.status(HttpStatus.OK).json({
        success: true,
        data: walletDetails,
      });
    } catch (error) {
      console.error("Error getting wallet details:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: HttpResponse.SERVER_ERROR,
      });
    }
  }

  async processWalletPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { docId, slotDate, slotTime, amount, appointmentId } = req.body;

      if (!docId || !slotDate || !slotTime || !amount || !appointmentId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: HttpResponse.FIELDS_REQUIRED,
        });
        return;
      }

      const paymentData = {
        userId,
        docId,
        slotDate,
        slotTime,
        amount,
        appointmentId,
      };

      const result = await this._userService.processWalletPayment(paymentData);
      
      if (result.success) {
        res.status(HttpStatus.OK).json(result);
      } else {
        res.status(HttpStatus.BAD_REQUEST).json(result);
      }
    } catch (error) {
      console.error("Error processing wallet payment:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: HttpResponse.SERVER_ERROR,
      });
    }
  }

  async finalizeWalletPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { appointmentId, amount } = req.body;

      if (!appointmentId || !amount) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: HttpResponse.FIELDS_REQUIRED,
        });
        return;
      }

      const result = await this._userService.finalizeWalletPayment(appointmentId, userId, amount);
      
      if (result.success) {
        res.status(HttpStatus.OK).json(result);
      } else {
        res.status(HttpStatus.BAD_REQUEST).json(result);
      }
    } catch (error) {
      console.error("Error finalizing wallet payment:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: HttpResponse.SERVER_ERROR,
      });
    }
  }

  async validateWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { amount } = req.body;

      if (!amount) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: HttpResponse.FIELDS_REQUIRED,
        });
        return;
      }

      const hasSufficientBalance = await this._userService.validateWalletBalance(userId, amount);
      
      res.status(HttpStatus.OK).json({
        success: true,
        hasSufficientBalance,
        message: hasSufficientBalance 
          ? "Sufficient balance available" 
          : HttpResponse.WALLET_INSUFFICIENT_BALANCE,
      });
    } catch (error) {
      console.error("Error validating wallet balance:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: HttpResponse.SERVER_ERROR,
      });
    }
  }
}
