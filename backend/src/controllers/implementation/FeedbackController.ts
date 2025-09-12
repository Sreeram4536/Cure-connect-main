import { Request, Response } from "express";
import { FeedbackService } from "../../services/implementation/FeedbackService";
import { HttpStatus } from "../../constants/status.constants";

export class FeedbackController {
  constructor(private service: FeedbackService) {}

  async create(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params as any;
      const userId = (req as any).userId as string;
      const { rating, comment } = req.body;
      const saved = await this.service.addFeedback(appointmentId, userId, rating, comment);
      res.json({ success: true, feedback: saved });
    } catch (e: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: e.message });
    }
  }
}


