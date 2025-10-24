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
import { LeaveManagementRepository } from "../repositories/implementation/LeaveManagementRepository";
import { MetricsService } from "../services/implementation/MetricsService";
import { AdminRepository } from "../repositories/implementation/AdminRepository";
import { PrescriptionRepository } from "../repositories/implementation/PrescriptionRepository";
import { FeedbackRepository } from "../repositories/implementation/FeedbackRepository";
import { PrescriptionService } from "../services/implementation/PrescriptionService";
import { FeedbackService } from "../services/implementation/FeedbackService";
import { PrescriptionController } from "../controllers/implementation/PrescriptionController";
import { FeedbackController } from "../controllers/implementation/FeedbackController";
import { AppointmentCompletionService } from "../services/implementation/AppointmentCompletionService";
import { AppointmentCompletionController } from "../controllers/implementation/AppointmentCompletionController";
import { PatientHistoryRepository } from "../repositories/implementation/PatientHistoryRepository";
import { PatientHistoryService } from "../services/implementation/PatientHistoryService";
import { PatientHistoryController } from "../controllers/implementation/PatientHistoryController";
import { PatientHistoryPopulateService } from "../services/implementation/PatientHistoryPopulateService";

const doctorRepository = new DoctorRepository();
const slotRepository = new SlotRepository();
const walletRepository = new WalletRepository();
const leaveManagementRepository = new LeaveManagementRepository
const walletService = new WalletService(walletRepository);
const leaveManagementService = new LeaveManagementService(walletService,leaveManagementRepository)
const slotRuleRepository = new SlotRuleRepository(leaveManagementService)
const appointmentRepository = new AppointmentRepository();
const userRepository = new UserRepository();
const slotLockService = new SlotLockService(appointmentRepository, userRepository, doctorRepository);
const doctorService = new DoctorService(doctorRepository,walletService,slotLockService);
const slotService = new DoctorSlotService(slotRepository,slotRuleRepository);
const slotRuleService = new SlotRuleService(slotRuleRepository);
const adminRepository = new AdminRepository();
const doctorMetricsService = new MetricsService(walletRepository, appointmentRepository, adminRepository);
export const doctorController = new DoctorController(doctorService, slotService);
export const slotRuleController = new SlotRuleController(slotRuleService);
export const slotLockController = new SlotLockController(slotLockService);
export { doctorMetricsService };
// New DI
const prescriptionRepository = new PrescriptionRepository();
const feedbackRepository = new FeedbackRepository();

// Patient History DI
const patientHistoryRepository = new PatientHistoryRepository();
export const patientHistoryService = new PatientHistoryService(patientHistoryRepository);
export const patientHistoryPopulateService = new PatientHistoryPopulateService(
  patientHistoryService,
  appointmentRepository,
  prescriptionRepository,
  doctorRepository,
  userRepository
);
export const patientHistoryController = new PatientHistoryController(
  patientHistoryService,
  patientHistoryPopulateService
);

const prescriptionService = new PrescriptionService(prescriptionRepository, appointmentRepository);
const feedbackService = new FeedbackService(feedbackRepository,appointmentRepository);
export const prescriptionController = new PrescriptionController(prescriptionService);
export const feedbackController = new FeedbackController(feedbackService);
const appointmentCompletionService = new AppointmentCompletionService(appointmentRepository, prescriptionRepository, patientHistoryService, doctorRepository);
export const appointmentCompletionController = new AppointmentCompletionController(appointmentCompletionService);