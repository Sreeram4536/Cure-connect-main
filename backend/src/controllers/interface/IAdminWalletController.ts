import { Request, Response } from "express";

export interface IAdminWalletController {
  getWalletBalance(req: Request, res: Response): Promise<void>;
  getWalletTransactions(req: Request, res: Response): Promise<void>;
  getWalletDetails(req: Request, res: Response): Promise<void>;
  getWalletDTO(req: Request, res: Response): Promise<void>;
  getAllDoctorWallets(req: Request, res: Response): Promise<void>;
  getAllAdminWallets(req: Request, res: Response): Promise<void>;
}
