import { Request, Response } from "express";
import { IWalletService } from "../../services/interface/IWalletService";
import { IAdminWalletController } from "../interface/IAdminWalletController";
import { HttpStatus } from "../../constants/status.constants";

export class AdminWalletController implements IAdminWalletController {
  private _walletService: IWalletService;

  constructor(walletService: IWalletService) {
    this._walletService = walletService;
  }

  async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const requestedAdminId = (req as any).adminId;
      if (!requestedAdminId) {
        res.status(401).json({ success: false, message: "Admin not authenticated" });
        return;
      }
      let adminId = process.env.ADMIN_WALLET_ID || requestedAdminId;
      
      
      if (!adminId) {
        const adminModel = require('../../models/adminModel').default;
        const admin = await adminModel.findOne().lean();
        if (admin) {
          adminId = admin._id.toString();
          console.log('Using admin ID for wallet:', adminId);
        } else {
          res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'No admin found and ADMIN_WALLET_ID not configured' });
          return;
        }
      }
      const balance = await this._walletService.getWalletBalance(adminId, 'admin');
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: { balance },
        message: "Admin wallet balance retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting admin wallet balance:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get admin wallet balance"
      });
    }
  }

  async getWalletTransactions(req: Request, res: Response): Promise<void> {
    try {
      const requestedAdminId = (req as any).adminId;
      if (!requestedAdminId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Admin not authenticated" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      const type = req.query.type as 'credit' | 'debit' | undefined;
      const startDateStr = req.query.startDate as string;
      const endDateStr = req.query.endDate as string;

      // Parse dates only if present
      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;

      let adminId = process.env.ADMIN_WALLET_ID || requestedAdminId;
      
      
      if (!adminId) {
        const adminModel = require('../../models/adminModel').default;
        const admin = await adminModel.findOne().lean();
        if (admin) {
          adminId = admin._id.toString();
          console.log('Using admin ID for wallet:', adminId);
        } else {
          res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'No admin found and ADMIN_WALLET_ID not configured' });
          return;
        }
      }
      const transactions = await this._walletService.getWalletTransactions(
        adminId,
        'admin',
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
        message: "Admin wallet transactions retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting admin wallet transactions:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get admin wallet transactions"
      });
    }
  }

  async getWalletDetails(req: Request, res: Response): Promise<void> {
    try {
      const requestedAdminId = (req as any).adminId;
      if (!requestedAdminId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Admin not authenticated" });
        return;
      }
      let adminId = process.env.ADMIN_WALLET_ID || requestedAdminId;
      
      
      if (!adminId) {
        const adminModel = require('../../models/adminModel').default;
        const admin = await adminModel.findOne().lean();
        if (admin) {
          adminId = admin._id.toString();
          console.log('Using admin ID for wallet:', adminId);
        } else {
          res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'No admin found and ADMIN_WALLET_ID not configured' });
          return;
        }
      }
      const walletDetails = await this._walletService.getWalletDetails(adminId, 'admin');

      res.status(HttpStatus.OK).json({
        success: true,
        data: walletDetails,
        message: "Admin wallet details retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting admin wallet details:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get admin wallet details"
      });
    }
  }

  async getWalletDTO(req: Request, res: Response): Promise<void> {
    try {
      const requestedAdminId = (req as any).adminId;
      if (!requestedAdminId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Admin not authenticated" });
        return;
      }
      let adminId = process.env.ADMIN_WALLET_ID || requestedAdminId;
      
      
      if (!adminId) {
        const adminModel = require('../../models/adminModel').default;
        const admin = await adminModel.findOne().lean();
        if (admin) {
          adminId = admin._id.toString();
          console.log('Using admin ID for wallet:', adminId);
        } else {
          res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'No admin found and ADMIN_WALLET_ID not configured' });
          return;
        }
      }
      const walletDTO = await this._walletService.getWalletDTO(adminId, 'admin');

      res.status(HttpStatus.OK).json({
        success: true,
        data: walletDTO,
        message: "Admin wallet DTO retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting admin wallet DTO:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get admin wallet DTO"
      });
    }
  }

  async getAllDoctorWallets(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const wallets = await this._walletService.getWalletsByRole('doctor', page, limit);

      res.status(HttpStatus.OK).json({
        success: true,
        data: wallets,
        message: "All doctor wallets retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting all doctor wallets:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get all doctor wallets"
      });
    }
  }

  async getAllAdminWallets(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const wallets = await this._walletService.getWalletsByRole('admin', page, limit);

      res.status(HttpStatus.OK).json({
        success: true,
        data: wallets,
        message: "All admin wallets retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting all admin wallets:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get all admin wallets"
      });
    }
  }
}
