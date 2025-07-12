import { SlotRuleRepository } from "../../repositories/implementation/SlotRuleRepository";

export class SlotRuleService {
  constructor(private repo = new SlotRuleRepository()) {}

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
}

