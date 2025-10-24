import { Request, Response } from "express";
import { FeedbackService } from "../../services/implementation/FeedbackService";
import { HttpStatus } from "../../constants/status.constants";
import { IFeedbackService } from "../../services/interface/IFeedbackService";

export class FeedbackController {
  constructor(private _feedbackservice: IFeedbackService) {}

  async create(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params as any;
      const userId = (req as any).userId as string;
      const { rating, comment } = req.body;
      const saved = await this._feedbackservice.addFeedback(appointmentId, userId, rating, comment);
      res.json({ success: true, feedback: saved });
    } catch (e: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: e.message });
    }
  }

  async listByDoctor(req: Request, res: Response) {
    try {
      const { doctorId } = req.params as any;
      const page = parseInt((req.query.page as string) || "1", 10);
      const limit = parseInt((req.query.limit as string) || "5", 10);
      const result = await this._feedbackservice.listByDoctor(doctorId, page, limit);
      res.json({ success: true, ...result, page, limit });
    } catch (e: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: e.message });
    }
  }
}


