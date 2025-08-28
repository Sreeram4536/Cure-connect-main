import { WalletController } from "../controllers/implementation/WalletController";
import { WalletRepository } from "../repositories/implementation/WalletRepository";
import { WalletService } from "../services/implementation/WalletService";

const walletRepository = new WalletRepository();
const walletService = new WalletService(walletRepository);
export const walletController = new WalletController(walletService);