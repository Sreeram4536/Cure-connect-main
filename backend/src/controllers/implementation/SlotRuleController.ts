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
    let rule = req.body;
    // Backend-side validation for customDays and slots
    if (Array.isArray(rule.customDays)) {
      rule.customDays = rule.customDays.map((cd: any) => ({
        date: cd.date,
        leaveType: cd.leaveType,
        breaks: Array.isArray(cd.breaks) ? cd.breaks : [],
        reason: cd.reason || "",
        slots: Array.isArray(cd.slots)
          ? cd.slots.filter(
              (s: any) => s.start && typeof s.duration === 'number' && typeof s.cancelled === 'boolean'
            )
          : []
      })).filter((cd: any) => cd.date && cd.leaveType && ["full","break","custom"].includes(cd.leaveType));
    } else {
      rule.customDays = [];
    }
    try {
      const saved = await this.service.setRule(doctorId, rule);
      res.json({ success: true, rule: saved });
    } catch (err: any) {
      console.error('Failed to save slot rule:', err);
      res.status(400).json({ success: false, message: err.message || 'Failed to save rule' });
    }
  }

  async updateCustomSlot(req: Request, res: Response) {
    const doctorId = (req as any).docId;
    const { date, start, duration } = req.body;
    // Validate date/time is not in the past
    const now = new Date();
    const slotDateTime = new Date(`${date}T${start}`);
    if (slotDateTime < now) {
      return res.status(400).json({ success: false, message: 'Cannot edit past slots.' });
    }
    const updated = await this.service.updateCustomSlot(doctorId, date, start, duration);
    res.json({ success: true, slot: updated });
  }

  async cancelCustomSlot(req: Request, res: Response) {
    const doctorId = (req as any).docId;
    const { date, start } = req.body;
    // Validate date/time is not in the past
    const now = new Date();
    const slotDateTime = new Date(`${date}T${start}`);
    if (slotDateTime < now) {
      return res.status(400).json({ success: false, message: 'Cannot cancel past slots.' });
    }
    const updated = await this.service.cancelCustomSlot(doctorId, date, start);
    res.json({ success: true, slot: updated });
  }
}

