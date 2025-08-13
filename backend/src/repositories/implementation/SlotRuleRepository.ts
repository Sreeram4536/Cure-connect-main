import SlotRule from "../../models/slotRuleModel";
import mongoose from "mongoose";
import { LeaveManagementService } from "../../services/implementation/LeaveManagementService";
import { ISlotRuleRepository } from "../interface/ISlotRuleRepository";

export class SlotRuleRepository implements ISlotRuleRepository {
  private leaveManagementService: LeaveManagementService;

  constructor() {
    this.leaveManagementService = new LeaveManagementService();
  }

  async getRuleByDoctor(doctorId: string) {
    return SlotRule.findOne({ doctorId: new mongoose.Types.ObjectId(doctorId) });
  }
  
  async upsertRule(doctorId: string, rule: any) {
    return SlotRule.findOneAndUpdate(
      { doctorId: new mongoose.Types.ObjectId(doctorId) },
      { ...rule, doctorId: new mongoose.Types.ObjectId(doctorId) },
      { upsert: true, new: true }
    );
  }
  
  async updateCustomSlot(doctorId: string, date: string, start: string, duration: number) {
    
    const rule = await SlotRule.findOne({ doctorId: new mongoose.Types.ObjectId(doctorId) });
    if (!rule) throw new Error('Slot rule not found');
    
    let customDay = rule.customDays.find((d: any) => d.date === date);
    if (!customDay) {
      customDay = rule.customDays.create({ date, leaveType: 'custom', slots: [] });
      rule.customDays.push(customDay);
    }
    
    let slot = customDay.slots.find((s: any) => s.start === start);
    if (!slot) {
      slot = customDay.slots.create({ start, duration, cancelled: false });
      customDay.slots.push(slot);
    } else {
      slot.duration = duration;
      slot.cancelled = false;
    }
    await rule.save();
    return slot;
  }
  
  async cancelCustomSlot(doctorId: string, date: string, start: string) {
    const rule = await SlotRule.findOne({ doctorId: new mongoose.Types.ObjectId(doctorId) });
    if (!rule) throw new Error('Slot rule not found');
    let customDay = rule.customDays.find((d: any) => d.date === date);
    if (!customDay) {
      customDay = rule.customDays.create({ date, leaveType: 'custom', slots: [] });
      rule.customDays.push(customDay);
    }
    let slot = customDay.slots.find((s: any) => s.start === start);
    if (!slot) {
      slot = customDay.slots.create({ start, duration: 30, cancelled: true });
      customDay.slots.push(slot);
    } else {
      slot.cancelled = true;
    }
    await rule.save();
    return slot;
  }

  // New method to handle setting a day as leave
  async setDayAsLeave(doctorId: string, date: string, leaveType: 'full' | 'break' | 'custom', slots?: any[]) {
    try {
      console.log(`[SlotRuleRepository] Setting day as leave for doctorId: ${doctorId}, date: ${date}, leaveType: ${leaveType}`);
      
      const rule = await SlotRule.findOne({ doctorId: new mongoose.Types.ObjectId(doctorId) });
      if (!rule) throw new Error('Slot rule not found');
      
      // Find or create custom day
      let customDay = rule.customDays.find((d: any) => d.date === date);
      if (!customDay) {
        const customDayData: any = { 
          date, 
          leaveType, 
          slots: slots || []
        };
        
        if (leaveType === 'break') {
          customDayData.breaks = [];
        }
        
        customDay = rule.customDays.create(customDayData);
        rule.customDays.push(customDay);
      } else {
        customDay.leaveType = leaveType;
        if (slots) {
          customDay.slots = slots as any;
        }
        if (leaveType === 'break') {
          customDay.breaks = [] as any;
        }
      }
      
      await rule.save();
      
      // Handle appointment cancellations for future dates only
      const today = new Date();
      const leaveDate = new Date(date);
      
      if (leaveDate > today) {
        console.log(`[SlotRuleRepository] Leave date is in the future, handling appointment cancellations`);
        try {
          const result = await this.leaveManagementService.handleDoctorLeave(doctorId, date, leaveType);
          console.log(`[SlotRuleRepository] Leave management result:`, result);
          return { ...customDay.toObject(), leaveManagementResult: result };
        } catch (error) {
          console.error(`[SlotRuleRepository] Error handling leave management:`, error);
          // Don't fail the slot update if leave management fails
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { ...customDay.toObject(), leaveManagementError: errorMessage };
        }
      } else {
        console.log(`[SlotRuleRepository] Leave date is in the past, skipping appointment cancellations`);
        return customDay.toObject();
      }
      
    } catch (error) {
      console.error(`[SlotRuleRepository] Error setting day as leave:`, error);
      throw error;
    }
  }

  // New method to remove leave for a day
  async removeDayLeave(doctorId: string, date: string) {
    try {
      console.log(`[SlotRuleRepository] Removing leave for doctorId: ${doctorId}, date: ${date}`);
      
      const rule = await SlotRule.findOne({ doctorId: new mongoose.Types.ObjectId(doctorId) });
      if (!rule) throw new Error('Slot rule not found');
      
      // Remove the custom day
      rule.customDays = rule.customDays.filter((d: any) => d.date !== date) as any;
      await rule.save();
      
      return { success: true, message: 'Leave removed successfully' };
      
    } catch (error) {
      console.error(`[SlotRuleRepository] Error removing day leave:`, error);
      throw error;
    }
  }
}

