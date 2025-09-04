import { WalletController } from "../controllers/implementation/WalletController";
import { WalletRepository } from "../repositories/implementation/WalletRepository";
import { WalletService } from "../services/implementation/WalletService";
import { RevenueDistributionService } from "../services/implementation/RevenueDistributionService";

const walletRepository = new WalletRepository();
const walletService = new WalletService(walletRepository);
const revenueDistributionService = new RevenueDistributionService(walletService);

export const walletController = new WalletController(walletService);
export { revenueDistributionService };