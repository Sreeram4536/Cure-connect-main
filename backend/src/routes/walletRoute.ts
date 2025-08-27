import { Router } from "express";
import { WalletController } from "../controllers/implementation/WalletController";
import authUser from "../middlewares/authUser";
import { WalletService } from "../services/implementation/WalletService";
import { WalletRepository } from "../repositories/implementation/WalletRepository";

const router = Router();
const walletRepository = new WalletRepository();
const walletService = new WalletService(walletRepository);
const walletController = new WalletController(walletService);

// Get wallet balance
router.get("/balance", authUser, walletController.getWalletBalance.bind(walletController));

// Get wallet transactions with pagination
router.get("/transactions", authUser, walletController.getWalletTransactions.bind(walletController));

// Get wallet details (balance + transaction count)
router.get("/details", authUser, walletController.getWalletDetails.bind(walletController));

export default router; 