import { Request, Response } from "express";
import { SlotRuleService } from "../../services/implementation/SlotRuleService";

export class SlotRuleController {
  constructor(private service = new SlotRuleService()) {}

  async getRule(req: Request, res: Response) {
    const doctorId = (req as any).docId;
    const rule = await this.service.getRule(doctorId);
    res.json({ success: true, rule });
  }

  async setRule(req: Request, res: Response) {
    const doctorId = (req as any).docId;
    const rule = req.body;
    const saved = await this.service.setRule(doctorId, rule);
    res.json({ success: true, rule: saved });
  }
}

