import { Router } from "express";
import authUser from "../middlewares/authUser";
import {walletController} from "../dependencyhandler/wallet.dependency"

const router = Router();



router.get("/balance", authUser, walletController.getWalletBalance.bind(walletController));


router.get("/transactions", authUser, walletController.getWalletTransactions.bind(walletController));


router.get("/details", authUser, walletController.getWalletDetails.bind(walletController));

export default router; 