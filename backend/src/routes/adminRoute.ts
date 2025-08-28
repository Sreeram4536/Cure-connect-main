import express from "express";
import upload from "../middlewares/multer";
import authRole from "../middlewares/authRole";
// import {doctorController,slotLockController,slotRuleController} from "../dependencyhandler/admin.dependency"

// Dependency layers
import { AdminRepository } from "../repositories/implementation/AdminRepository";
import { AdminService } from "../services/implementation/AdminService";
import { AdminController } from "../controllers/implementation/AdminController";

import { DoctorRepository } from "../repositories/implementation/DoctorRepository";
import { DoctorService } from "../services/implementation/DoctorService";
import { DoctorController } from "../controllers/implementation/DoctorController";
import { DoctorSlotService } from "../services/implementation/SlotService";
import { SlotRepository } from "../repositories/implementation/SlotRepository";
import { UserRepository } from "../repositories/implementation/UserRepository";
import { AppointmentRepository } from "../repositories/implementation/AppointmentRepository";
import { SlotLockService } from "../services/implementation/SlotLockService";
import { WalletService } from "../services/implementation/WalletService";
import { SlotRuleRepository } from "../repositories/implementation/SlotRuleRepository";
import { WalletRepository } from "../repositories/implementation/WalletRepository";
import { LeaveManagementService } from "../services/implementation/LeaveManagementService";
import { LeaveManagementRepository } from "../repositories/implementation/LeaveManagementRepository";

// Admin Layer
const adminRepository = new AdminRepository();
const doctorRepository = new DoctorRepository();
const slotRepository = new SlotRepository();
const userRepository = new UserRepository();
const appointmentRepository = new AppointmentRepository();
const walletRepository = new WalletRepository();
const walletService = new WalletService(walletRepository);
const slotLockService = new SlotLockService(
  appointmentRepository,
  userRepository,
  doctorRepository
);
const adminService = new AdminService(adminRepository, doctorRepository,  walletService,
  userRepository,
  slotLockService);
const adminController = new AdminController(adminService);

// Doctor Layer
const leaveManagementRepository = new LeaveManagementRepository
const leaveManagementService =  new LeaveManagementService(walletService,leaveManagementRepository)
const slotRuleRepository = new SlotRuleRepository(leaveManagementService)
const doctorService = new DoctorService(doctorRepository,walletService,slotLockService);
const SlotService = new DoctorSlotService(slotRepository,slotRuleRepository);
const doctorController = new DoctorController(doctorService, SlotService);

const adminRouter = express.Router();

adminRouter.post("/login", adminController.loginAdmin.bind(adminController));
adminRouter.post(
  "/refresh-token",
  adminController.refreshAdminToken.bind(adminController)
);

adminRouter.post(
  "/logout",
  adminController.logoutAdmin.bind(adminController)
);
adminRouter.get(
  "/users",
  authRole(["admin"]),
  adminController.getUsersPaginated.bind(adminController)
);
adminRouter.patch(
  "/users/:userId/block",
  authRole(["admin"]),
  adminController.toggleUserBlock.bind(adminController)
);
adminRouter.post(
  "/doctors",
  authRole(["admin"]),
  upload.single("image"),
  adminController.addDoctor.bind(adminController)
);
adminRouter.get(
  "/doctors",
  authRole(["admin"]),
  adminController.getDoctorsPaginated.bind(adminController)
);

adminRouter.patch(
  "/doctors/:id/approve",
  authRole(["admin"]),
  adminController.approveDoctor.bind(adminController)
);
adminRouter.patch(
  "/doctors/:id/reject",
  authRole(["admin"]),
  adminController.rejectDoctor.bind(adminController)
);

adminRouter.patch(
  "/doctors/:doctorId/availability",
  authRole(["admin"]),
  doctorController.changeAvailability.bind(doctorController)
);

adminRouter.patch(
  "/doctors/:doctorId/block",
  authRole(["admin"]),
  adminController.toggleDoctorBlock.bind(adminController)
);

adminRouter.get(
  "/appointments",
  authRole(["admin"]),
  adminController.appointmentsListPaginated.bind(adminController)
);

adminRouter.patch(
  "/appointments/:appointmentId/cancel",
  authRole(["admin"]),
  adminController.adminCancelAppointment.bind(adminController)
);

adminRouter.get(
  "/dashboard",
  authRole(["admin"]),
  adminController.adminDashboard.bind(adminController)
);

export default adminRouter;
