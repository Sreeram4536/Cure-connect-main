import { Request, Response } from "express";
import { IWalletController } from "../interface/IWalletController.interface";
import { IWalletService } from "../../services/interface/IWalletService";
import { AuthRequest } from "../../types/customRequest";
import { HttpStatus } from "../../constants/status.constants";

export class WalletController implements IWalletController {
  private _walletService: IWalletService;

  constructor(walletService: IWalletService) {
    this._walletService =  walletService;
  }

  async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      const balance = await this._walletService.getWalletBalance(userId, 'user');
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: { balance },
        message: "Wallet balance retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get wallet balance"
      });
    }
  }

  async getWalletTransactions(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[WalletController] *** NEW CODE VERSION - getWalletTransactions called ***`);
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "User not authenticated" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      console.log(`[WalletController] Raw query object:`, req.query);
      console.log(`[WalletController] req.query.type:`, req.query.type, typeof req.query.type);
      
      // More robust type parsing
      let type: 'credit' | 'debit' | undefined = undefined;
      if (req.query.type === 'credit' || req.query.type === 'debit') {
        type = req.query.type;
      }
      
      // FORCE TEST: If type is still undefined, try to extract from URL
      if (!type && req.url.includes('type=')) {
        const urlMatch = req.url.match(/type=([^&]+)/);
        if (urlMatch && (urlMatch[1] === 'credit' || urlMatch[1] === 'debit')) {
          type = urlMatch[1];
          console.log(`[WalletController] *** EXTRACTED TYPE FROM URL: ${type} ***`);
        }
      }
      
      console.log(`[WalletController] Parsed type:`, type);
      const startDateStr = req.query.startDate as string;
      const endDateStr = req.query.endDate as string;

      // Parse dates only if present
      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;

      console.log(`[WalletController] *** USER WALLET REQUEST ***`);
      console.log(`[WalletController] Received query parameters:`, {
        page,
        limit,
        sortBy,
        sortOrder,
        type,
        startDateStr,
        endDateStr,
        startDate,
        endDate
      });
      console.log(`[WalletController] *** CALLING SERVICE WITH TYPE: ${type} ***`);

      // const transactions = await this._walletService.getWalletTransactions(
      //   userId,
      //   'user',
      //   page,
      //   limit,
      //   sortBy,
      //   sortOrder,
        
      // );
      const transactions = await this._walletService.getWalletTransactions(
  userId,
  'user',
  page,
  limit,
  sortBy,
  sortOrder,
  type,
  startDate,
  endDate
);


      res.status(HttpStatus.OK).json({
        success: true,
        data: transactions,
        message: "Wallet transactions retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting wallet transactions:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get wallet transactions"
      });
    }
  }

  async getWalletDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "User not authenticated" });
        return;
      }

      const walletDetails = await this._walletService.getWalletDetails(userId, 'user');

      res.status(HttpStatus.OK).json({
        success: true,
        data: walletDetails,
        message: "Wallet details retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting wallet details:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get wallet details"
      });
    }
  }
} 