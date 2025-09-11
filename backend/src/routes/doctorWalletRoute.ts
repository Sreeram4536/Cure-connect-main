import { Router } from "express";
import { DoctorWalletController } from "../controllers/implementation/DoctorWalletController";
import { WalletService } from "../services/implementation/WalletService";
import { WalletRepository } from "../repositories/implementation/WalletRepository";
import  authDoctor  from "../middlewares/authDoctor";

const router = Router();

// Initialize services
const walletRepository = new WalletRepository();
const walletService = new WalletService(walletRepository);
const doctorWalletController = new DoctorWalletController(walletService);

// Apply authentication middleware to all routes
router.use(authDoctor);

// Doctor wallet routes
router.get("/balance", (req, res) => doctorWalletController.getWalletBalance(req, res));
router.get("/transactions", (req, res) => doctorWalletController.getWalletTransactions(req, res));
router.get("/details", (req, res) => doctorWalletController.getWalletDetails(req, res));
router.get("/wallet", (req, res) => doctorWalletController.getWalletDTO(req, res));

export default router;
