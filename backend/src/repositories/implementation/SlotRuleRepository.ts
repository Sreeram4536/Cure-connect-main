import SlotRule from "../../models/slotRuleModel";

export class SlotRuleRepository {
  async getRuleByDoctor(doctorId: string) {
    return SlotRule.findOne({ doctorId });
  }
  async upsertRule(doctorId: string, rule: any) {
    return SlotRule.findOneAndUpdate({ doctorId }, { ...rule, doctorId }, { upsert: true, new: true });
  }
}

