import { SlotRuleRepository } from "../../repositories/implementation/SlotRuleRepository";

export class SlotRuleService {
  constructor(private repo = new SlotRuleRepository()) {}

  async getRule(doctorId: string) {
    return this.repo.getRuleByDoctor(doctorId);
  }
  async setRule(doctorId: string, rule: any) {
    return this.repo.upsertRule(doctorId, rule);
  }
}

