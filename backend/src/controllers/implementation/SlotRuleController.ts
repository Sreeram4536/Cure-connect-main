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
    
    const now = new Date();
    const slotDateTime = new Date(`${date}T${start}`);
    if (slotDateTime < now) {
      return res.status(400).json({ success: false, message: 'Cannot cancel past slots.' });
    }
    const updated = await this.service.cancelCustomSlot(doctorId, date, start);
    res.json({ success: true, slot: updated });
  }

  // New method to set a day as leave
  async setDayAsLeave(req: Request, res: Response) {
    try {
      const doctorId = (req as any).docId;
      const { date, leaveType, slots } = req.body;
      
      // Validate required fields
      if (!date || !leaveType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Date and leaveType are required' 
        });
      }

      // Validate leaveType
      if (!['full', 'break', 'custom'].includes(leaveType)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid leaveType. Must be one of: full, break, custom' 
        });
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format. Use YYYY-MM-DD' 
        });
      }

      // Check if date is in the past
      const now = new Date();
      const leaveDate = new Date(date);
      if (leaveDate < now) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot set leave for past dates' 
        });
      }

      const result = await this.service.setDayAsLeave(doctorId, date, leaveType, slots);
      
      res.json({ 
        success: true, 
        message: 'Leave set successfully',
        data: result
      });
      
    } catch (error: any) {
      console.error('Failed to set day as leave:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to set leave' 
      });
    }
  }

  // New method to remove leave for a day
  async removeDayLeave(req: Request, res: Response) {
    try {
      const doctorId = (req as any).docId;
      const { date } = req.params;
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format. Use YYYY-MM-DD' 
        });
      }

      const result = await this.service.removeDayLeave(doctorId, date);
      
      res.json({ 
        success: true, 
        message: 'Leave removed successfully',
        data: result
      });
      
    } catch (error: any) {
      console.error('Failed to remove leave:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to remove leave' 
      });
    }
  }
}

