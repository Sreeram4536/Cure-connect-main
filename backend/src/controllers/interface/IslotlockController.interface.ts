import { Request, Response } from "express";

export interface ISlotLockController {
  lockSlot(req: Request, res: Response): Promise<void>;
  releaseSlot(req: Request, res: Response): Promise<void>;
  confirmAppointment(req: Request, res: Response): Promise<void>;
  cancelAppointment(req: Request, res: Response): Promise<void>;
} 