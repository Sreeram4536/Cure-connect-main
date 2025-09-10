import { Router } from "express";
import { AdminWalletController } from "../controllers/implementation/AdminWalletController";
import { WalletService } from "../services/implementation/WalletService";
import { WalletRepository } from "../repositories/implementation/WalletRepository";
import  authAdmin  from "../middlewares/authAdmin";

const router = Router();

// Initialize services
const walletRepository = new WalletRepository();
const walletService = new WalletService(walletRepository);
const adminWalletController = new AdminWalletController(walletService);

// Apply authentication middleware to all routes
router.use(authAdmin);

// Admin wallet routes
router.get("/balance", (req, res) => adminWalletController.getWalletBalance(req, res));
router.get("/transactions", (req, res) => adminWalletController.getWalletTransactions(req, res));
router.get("/details", (req, res) => adminWalletController.getWalletDetails(req, res));
router.get("/wallet", (req, res) => adminWalletController.getWalletDTO(req, res));

// Admin management routes
router.get("/doctors", (req, res) => adminWalletController.getAllDoctorWallets(req, res));
router.get("/admins", (req, res) => adminWalletController.getAllAdminWallets(req, res));

export default router;
