import { Request, Response } from "express";
import { SlotRuleService } from "../../services/implementation/SlotRuleService";
import { ISlotRuleService } from "../../services/interface/ISlotRuleService";
import { CustomDayInput, DaySlot } from "../../types/slotRule";
import { AuthRequest } from "../../types/customRequest";

export class SlotRuleController {
  constructor(private service:ISlotRuleService) {}

  async getRule(req: Request, res: Response) {
    const doctorId = (req as AuthRequest).docId;
    if (!doctorId) {
      res.status(401).json({ success: false, message: "Doctor ID not found" });
      return;
    }
    const rule = await this.service.getRule(doctorId);
    res.json({ success: true, rule });
  }

  async setRule(req: Request, res: Response) {
    const doctorId = (req as AuthRequest).docId;
    if (!doctorId) {
      res.status(401).json({ success: false, message: "Doctor ID not found" });
      return;
    }
    let rule = req.body as { customDays?: CustomDayInput[] };
   
    if (Array.isArray(rule.customDays)) {
      rule.customDays = rule.customDays.map((cd: CustomDayInput) => ({
        date: cd.date,
        leaveType: cd.leaveType,
        breaks: Array.isArray(cd.breaks) ? cd.breaks : [],
        reason: cd.reason || "",
        slots: Array.isArray(cd.slots)
          ? cd.slots.filter(
              (s: DaySlot) => !!s.start && typeof s.duration === 'number' && typeof s.cancelled === 'boolean'
            ) as DaySlot[]
          : []
      })).filter((cd: CustomDayInput) => !!cd.date && !!cd.leaveType && ["full","break","custom"].includes(cd.leaveType));
    } else {
      rule.customDays = [];
    }
    try {
      const saved = await this.service.setRule(doctorId, rule);
      res.json({ success: true, rule: saved });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save rule';
      console.error('Failed to save slot rule:', err);
      res.status(400).json({ success: false, message });
    }
  }

  async updateCustomSlot(req: Request, res: Response) {
    const doctorId = (req as AuthRequest).docId;
    if (!doctorId) {
      return res.status(401).json({ success: false, message: 'Doctor ID not found' });
    }
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
    const doctorId = (req as AuthRequest).docId;
    if (!doctorId) {
      return res.status(401).json({ success: false, message: 'Doctor ID not found' });
    }
    const { date, start } = req.body;
    
    const now = new Date();
    const slotDateTime = new Date(`${date}T${start}`);
    if (slotDateTime < now) {
      return res.status(400).json({ success: false, message: 'Cannot cancel past slots.' });
    }
    const updated = await this.service.cancelCustomSlot(doctorId, date, start);
    res.json({ success: true, slot: updated });
  }

  
  async setDayAsLeave(req: Request, res: Response) {
    try {
      const doctorId = (req as any).docId;
      const { date, leaveType, slots } = req.body;
      
      
      if (!date || !leaveType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Date and leaveType are required' 
        });
      }

      
      if (!['full', 'break', 'custom'].includes(leaveType)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid leaveType. Must be one of: full, break, custom' 
        });
      }

    
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format. Use YYYY-MM-DD' 
        });
      }

    
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

