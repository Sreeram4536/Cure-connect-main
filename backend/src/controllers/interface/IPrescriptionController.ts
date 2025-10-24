import { Request, Response } from "express";

export interface IPrescriptionController {
  create(req: Request, res: Response): Promise<void>;
  getByAppointment(req: Request, res: Response): Promise<void>;
  listByUser(req: Request, res: Response): Promise<void>;
  listByDoctor(req: Request, res: Response): Promise<void>;
}


