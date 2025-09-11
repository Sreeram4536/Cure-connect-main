// import slotModel from "../../models/slotModel";
import slotRuleModel from "../../models/slotRuleModel";


export class SlotRepository {
  async getSlotsByDoctor(doctorId: string) {
    return slotRuleModel.find({ doctorId }).sort({ date: 1 }).exec();
  }

  async getSlotsByMonth(doctorId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const end = new Date(year, month, 0).toISOString().split("T")[0];
    return slotRuleModel.find({
      doctorId,
      date: { $gte: start, $lte: end },
    }).exec();
  }

  async upsertSlot(doctorId: string, date: string, slots: { start: string; end: string }[], isCancelled: boolean) {
    return slotRuleModel.findOneAndUpdate(
      { doctorId, date },
      { slots, isCancelled },
      { upsert: true, new: true }
    );
  }

  async deleteSlot(doctorId: string, date: string) {
    return slotRuleModel.findOneAndDelete({ doctorId, date });
  }
}
