import { Request, Response } from "express";
import { IWalletService } from "../../services/interface/IWalletService";
import { AuthRequest } from "../../types/customRequest";
import { UserRole } from "../../types/wallet";

export class AdminWalletController {
  private walletService: IWalletService;

  constructor(walletService: IWalletService) {
    this.walletService = walletService;
  }

  async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const requestedAdminId = (req as any).adminId;
      if (!requestedAdminId) {
        res.status(401).json({ success: false, message: "Admin not authenticated" });
        return;
      }
      const adminId = process.env.ADMIN_WALLET_ID || requestedAdminId;
      const balance = await this.walletService.getWalletBalance(adminId, 'admin');
      
      res.status(200).json({
        success: true,
        data: { balance },
        message: "Admin wallet balance retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting admin wallet balance:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get admin wallet balance"
      });
    }
  }

  async getWalletTransactions(req: Request, res: Response): Promise<void> {
    try {
      const requestedAdminId = (req as any).adminId;
      if (!requestedAdminId) {
        res.status(401).json({ success: false, message: "Admin not authenticated" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const adminId = process.env.ADMIN_WALLET_ID || requestedAdminId;
      const transactions = await this.walletService.getWalletTransactions(
        adminId,
        'admin',
        page,
        limit,
        sortBy,
        sortOrder
      );

      res.status(200).json({
        success: true,
        data: transactions,
        message: "Admin wallet transactions retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting admin wallet transactions:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get admin wallet transactions"
      });
    }
  }

  async getWalletDetails(req: Request, res: Response): Promise<void> {
    try {
      const requestedAdminId = (req as any).adminId;
      if (!requestedAdminId) {
        res.status(401).json({ success: false, message: "Admin not authenticated" });
        return;
      }
      const adminId = process.env.ADMIN_WALLET_ID || requestedAdminId;
      const walletDetails = await this.walletService.getWalletDetails(adminId, 'admin');

      res.status(200).json({
        success: true,
        data: walletDetails,
        message: "Admin wallet details retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting admin wallet details:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get admin wallet details"
      });
    }
  }

  async getWalletDTO(req: Request, res: Response): Promise<void> {
    try {
      const requestedAdminId = (req as any).adminId;
      if (!requestedAdminId) {
        res.status(401).json({ success: false, message: "Admin not authenticated" });
        return;
      }
      const adminId = process.env.ADMIN_WALLET_ID || requestedAdminId;
      const walletDTO = await this.walletService.getWalletDTO(adminId, 'admin');

      res.status(200).json({
        success: true,
        data: walletDTO,
        message: "Admin wallet DTO retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting admin wallet DTO:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get admin wallet DTO"
      });
    }
  }

  async getAllDoctorWallets(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const wallets = await this.walletService.getWalletsByRole('doctor', page, limit);

      res.status(200).json({
        success: true,
        data: wallets,
        message: "All doctor wallets retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting all doctor wallets:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get all doctor wallets"
      });
    }
  }

  async getAllAdminWallets(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const wallets = await this.walletService.getWalletsByRole('admin', page, limit);

      res.status(200).json({
        success: true,
        data: wallets,
        message: "All admin wallets retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting all admin wallets:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get all admin wallets"
      });
    }
  }
}
