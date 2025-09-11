import { AdminController } from "../controllers/implementation/AdminController";
import { DoctorController } from "../controllers/implementation/DoctorController";
import { AdminRepository } from "../repositories/implementation/AdminRepository";
import { AppointmentRepository } from "../repositories/implementation/AppointmentRepository";
import { DoctorRepository } from "../repositories/implementation/DoctorRepository";
import { LeaveManagementRepository } from "../repositories/implementation/LeaveManagementRepository";
import { SlotRepository } from "../repositories/implementation/SlotRepository";
import { SlotRuleRepository } from "../repositories/implementation/SlotRuleRepository";
import { UserRepository } from "../repositories/implementation/UserRepository";
import { WalletRepository } from "../repositories/implementation/WalletRepository";
import { AdminService } from "../services/implementation/AdminService";
import { DoctorService } from "../services/implementation/DoctorService";
import { LeaveManagementService } from "../services/implementation/LeaveManagementService";
import { SlotLockService } from "../services/implementation/SlotLockService";
import { DoctorSlotService } from "../services/implementation/SlotService";
import { WalletService } from "../services/implementation/WalletService";
import { MetricsService } from "../services/implementation/MetricsService";

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
const metricsService = new MetricsService(walletRepository, appointmentRepository, adminRepository);
const adminService = new AdminService(adminRepository, doctorRepository,  walletService,
  userRepository,
  slotLockService);
export const adminController = new AdminController(adminService);
export { metricsService };

// Doctor Layer
const leaveManagementRepository = new LeaveManagementRepository
const leaveManagementService =  new LeaveManagementService(walletService,leaveManagementRepository)
const slotRuleRepository = new SlotRuleRepository(leaveManagementService)
const doctorService = new DoctorService(doctorRepository,walletService,slotLockService);
const SlotService = new DoctorSlotService(slotRepository,slotRuleRepository);
export const doctorController = new DoctorController(doctorService, SlotService);