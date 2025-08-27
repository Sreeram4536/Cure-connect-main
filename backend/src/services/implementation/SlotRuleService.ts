import { SlotRuleRepository } from "../../repositories/implementation/SlotRuleRepository";
import { ISlotRuleRepository } from "../../repositories/interface/ISlotRuleRepository";

export class SlotRuleService {
  constructor(private repo :ISlotRuleRepository) {}

  async getRule(doctorId: string) {
    return this.repo.getRuleByDoctor(doctorId);
  }
  
  async setRule(doctorId: string, rule: any) {
    return this.repo.upsertRule(doctorId, rule);
  }
  
  async updateCustomSlot(doctorId: string, date: string, start: string, duration: number) {
    return this.repo.updateCustomSlot(doctorId, date, start, duration);
  }
  
  async cancelCustomSlot(doctorId: string, date: string, start: string) {
    return this.repo.cancelCustomSlot(doctorId, date, start);
  }

  // New method to set a day as leave
  async setDayAsLeave(doctorId: string, date: string, leaveType: 'full' | 'break' | 'custom', slots?: any[]) {
    return this.repo.setDayAsLeave(doctorId, date, leaveType, slots);
  }

  // New method to remove leave for a day
  async removeDayLeave(doctorId: string, date: string) {
    return this.repo.removeDayLeave(doctorId, date);
  }
}

