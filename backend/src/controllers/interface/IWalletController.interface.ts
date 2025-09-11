import { Request, Response } from "express";

export interface IWalletController {
  getWalletBalance(req: Request, res: Response): Promise<void>;
  getWalletTransactions(req: Request, res: Response): Promise<void>;
  getWalletDetails(req: Request, res: Response): Promise<void>;
} 