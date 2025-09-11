import { ChatController } from "../controllers/implementation/ChatController";
import { AppointmentRepository } from "../repositories/implementation/AppointmentRepository";
import { ChatRepository } from "../repositories/implementation/ChatRepository";
import { DoctorRepository } from "../repositories/implementation/DoctorRepository";
import { UserRepository } from "../repositories/implementation/UserRepository";
import { WalletRepository } from "../repositories/implementation/WalletRepository";
import { ChatService } from "../services/implementation/ChatService";
import { DoctorService } from "../services/implementation/DoctorService";
import { SlotLockService } from "../services/implementation/SlotLockService";
import { WalletService } from "../services/implementation/WalletService";

const chatRepository = new ChatRepository();
const userRepository = new UserRepository()
const walletRepository = new WalletRepository()
const appointmentRepository = new AppointmentRepository();
const doctorRepository = new DoctorRepository();
const walletService = new WalletService(walletRepository);
const slotLockService = new SlotLockService(
  appointmentRepository,
  userRepository,
  doctorRepository
);
const doctorService = new DoctorService(doctorRepository,walletService,slotLockService);
const chatService = new ChatService(chatRepository, doctorService, userRepository);
export const chatController = new ChatController(chatService);