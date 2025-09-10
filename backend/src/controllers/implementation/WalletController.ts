import { Request, Response } from "express";
import { IWalletController } from "../interface/IWalletController.interface";
import { WalletService } from "../../services/implementation/WalletService";
import { IWalletService } from "../../services/interface/IWalletService";
import { AuthRequest } from "../../types/customRequest";

export class WalletController implements IWalletController {
  private walletService: IWalletService;

  constructor(walletService: IWalletService) {
    this.walletService =  walletService;
  }

  async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      const balance = await this.walletService.getWalletBalance(userId, 'user');
      
      res.status(200).json({
        success: true,
        data: { balance },
        message: "Wallet balance retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get wallet balance"
      });
    }
  }

  async getWalletTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const transactions = await this.walletService.getWalletTransactions(
        userId,
        'user',
        page,
        limit,
        sortBy,
        sortOrder
      );

      res.status(200).json({
        success: true,
        data: transactions,
        message: "Wallet transactions retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting wallet transactions:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get wallet transactions"
      });
    }
  }

  async getWalletDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      const walletDetails = await this.walletService.getWalletDetails(userId, 'user');

      res.status(200).json({
        success: true,
        data: walletDetails,
        message: "Wallet details retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting wallet details:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get wallet details"
      });
    }
  }
} 