import { Request, Response } from "express";
import { PrescriptionService } from "../../services/implementation/PrescriptionService";

export class PrescriptionController {
  constructor(private service: PrescriptionService) {}

  async create(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params as any;
      const doctorId = (req as any).docId as string;
      const { userId, items, notes } = req.body;
      const saved = await this.service.addPrescription(appointmentId, doctorId, userId, items, notes);
      res.json({ success: true, prescription: saved });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async getByAppointment(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params as any;
      const data = await this.service.getByAppointment(appointmentId);
      res.json({ success: true, prescription: data });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async listByUser(req: Request, res: Response) {
    try {
      const userId = (req as any).userId as string;
      const list = await this.service.listByUser(userId);
      res.json({ success: true, prescriptions: list });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async listByDoctor(req: Request, res: Response) {
    try {
      const doctorId = (req as any).userId as string;
      const { userId } = req.params as any;
      const list = await this.service.listByDoctor(doctorId, userId);
      res.json({ success: true, prescriptions: list });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
}


