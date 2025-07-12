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
  async updateCustomSlot(doctorId: string, date: string, start: string, duration: number) {
    // Find the rule
    const rule = await SlotRule.findOne({ doctorId: new mongoose.Types.ObjectId(doctorId) });
    if (!rule) throw new Error('Slot rule not found');
    // Find or create the customDay for the date
    let customDay = rule.customDays.find((d: any) => d.date === date);
    if (!customDay) {
      customDay = rule.customDays.create({ date, leaveType: 'custom', slots: [] });
      rule.customDays.push(customDay);
    }
    // Find or create the slot
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
}

