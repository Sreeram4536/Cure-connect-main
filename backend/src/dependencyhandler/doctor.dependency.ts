import { DoctorController } from "../controllers/implementation/DoctorController";
import SlotLockController from "../controllers/implementation/SlotLockController";
import { SlotRuleController } from "../controllers/implementation/SlotRuleController";
import { AppointmentRepository } from "../repositories/implementation/AppointmentRepository";
import { DoctorRepository } from "../repositories/implementation/DoctorRepository";
import { SlotRepository } from "../repositories/implementation/SlotRepository";
import { UserRepository } from "../repositories/implementation/UserRepository";
import { DoctorService } from "../services/implementation/DoctorService";
import { SlotLockService } from "../services/implementation/SlotLockService";
import { DoctorSlotService } from "../services/implementation/SlotService";
import { SlotRuleService } from "../services/implementation/SlotRuleService";
import { SlotRuleRepository } from "../repositories/implementation/SlotRuleRepository";
import { WalletService } from "../services/implementation/WalletService";
import { WalletRepository } from "../repositories/implementation/WalletRepository";
import { LeaveManagementService } from "../services/implementation/LeaveManagementService";

const doctorRepository = new DoctorRepository();
const slotRepository = new SlotRepository();
const walletRepository = new WalletRepository();
const walletService = new WalletService(walletRepository);
const leaveManagementService = new LeaveManagementService(walletService)
const slotRuleRepository = new SlotRuleRepository(leaveManagementService)
const appointmentRepository = new AppointmentRepository();
const userRepository = new UserRepository();
const slotLockService = new SlotLockService(appointmentRepository, userRepository, doctorRepository);
const doctorService = new DoctorService(doctorRepository,walletService,slotLockService);
const slotService = new DoctorSlotService(slotRepository,slotRuleRepository);
const slotRuleService = new SlotRuleService(slotRuleRepository);
export const doctorController = new DoctorController(doctorService, slotService);
export const slotRuleController = new SlotRuleController(slotRuleService);
export const slotLockController = new SlotLockController(slotLockService);