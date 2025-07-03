import SlotRule from "../../models/slotRuleModel";
import mongoose from "mongoose";

export class SlotRuleRepository {
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
}

