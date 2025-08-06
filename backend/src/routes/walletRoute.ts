import { Router } from "express";
import { WalletController } from "../controllers/implementation/WalletController";
import authUser from "../middlewares/authUser";

const router = Router();
const walletController = new WalletController();

// Get wallet balance
router.get("/balance", authUser, walletController.getWalletBalance.bind(walletController));

// Get wallet transactions with pagination
router.get("/transactions", authUser, walletController.getWalletTransactions.bind(walletController));

// Get wallet details (balance + transaction count)
router.get("/details", authUser, walletController.getWalletDetails.bind(walletController));

export default router; 