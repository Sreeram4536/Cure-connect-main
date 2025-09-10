import { Request, Response } from "express";
import { IWalletService } from "../../services/interface/IWalletService";
import { AuthRequest } from "../../types/customRequest";
import { UserRole } from "../../types/wallet";

export class DoctorWalletController {
  private walletService: IWalletService;

  constructor(walletService: IWalletService) {
    this.walletService = walletService;
  }

  async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).docId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Doctor not authenticated" });
        return;
      }

      const balance = await this.walletService.getWalletBalance(userId, 'doctor');
      
      res.status(200).json({
        success: true,
        data: { balance },
        message: "Doctor wallet balance retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting doctor wallet balance:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get doctor wallet balance"
      });
    }
  }

  async getWalletTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).docId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Doctor not authenticated" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const transactions = await this.walletService.getWalletTransactions(
        userId,
        'doctor',
        page,
        limit,
        sortBy,
        sortOrder
      );

      res.status(200).json({
        success: true,
        data: transactions,
        message: "Doctor wallet transactions retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting doctor wallet transactions:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get doctor wallet transactions"
      });
    }
  }

  async getWalletDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).docId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Doctor not authenticated" });
        return;
      }

      const walletDetails = await this.walletService.getWalletDetails(userId, 'doctor');

      res.status(200).json({
        success: true,
        data: walletDetails,
        message: "Doctor wallet details retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting doctor wallet details:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get doctor wallet details"
      });
    }
  }

  async getWalletDTO(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).docId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Doctor not authenticated" });
        return;
      }

      const walletDTO = await this.walletService.getWalletDTO(userId, 'doctor');

      res.status(200).json({
        success: true,
        data: walletDTO,
        message: "Doctor wallet DTO retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting doctor wallet DTO:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get doctor wallet DTO"
      });
    }
  }
}
