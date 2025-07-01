import { SlotRepository } from "../../repositories/implementation/SlotRepository";
import { SlotRuleRepository } from "../../repositories/implementation/SlotRuleRepository";
import moment from "moment";

export class DoctorSlotService {
  constructor(
    private readonly _slotRepo: SlotRepository,
    private readonly _ruleRepo = new SlotRuleRepository()
  ) {}

  async getMonthlySlots(doctorId: string, year: number, month: number) {
    // 1. Get rule
    const rule = await this._ruleRepo.getRuleByDoctor(doctorId);
    if (!rule) return [];

    // 2. Generate slots for each day in the month
    const daysInMonth = moment({ year, month: month - 1 }).daysInMonth();
    const slots = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = moment({ year, month: month - 1, day });
      if (!rule.daysOfWeek.includes(date.day())) continue;

      let current = moment(date).set({
        hour: parseInt(rule.startTime.split(":")[0]),
        minute: parseInt(rule.startTime.split(":")[1]),
        second: 0,
        millisecond: 0
      });
      const end = moment(date).set({
        hour: parseInt(rule.endTime.split(":")[0]),
        minute: parseInt(rule.endTime.split(":")[1]),
        second: 0,
        millisecond: 0
      });

      while (current < end) {
        // Check if in break
        const inBreak = (rule.breaks || []).some((b: any) => {
          const breakStart = moment(date).set({
            hour: parseInt(b.start.split(":")[0]),
            minute: parseInt(b.start.split(":")[1])
          });
          const breakEnd = moment(date).set({
            hour: parseInt(b.end.split(":")[0]),
            minute: parseInt(b.end.split(":")[1])
          });
          return current >= breakStart && current < breakEnd;
        });
        if (!inBreak) {
          slots.push({
            date: date.format('YYYY-MM-DD'),
            start: current.format('HH:mm'),
            end: current.clone().add(rule.slotDuration, 'minutes').format('HH:mm')
          });
        }
        current = current.clone().add(rule.slotDuration, 'minutes');
      }
    }
    return slots;
  }

  // Keep updateDaySlot and deleteDaySlot for overrides/leave if needed
  async updateDaySlot(doctorId: string, date: string, slots: { start: string; end: string }[], isCancelled: boolean) {
    return this._slotRepo.upsertSlot(doctorId, date, slots, isCancelled);
  }

  async deleteDaySlot(doctorId: string, date: string) {
    return this._slotRepo.deleteSlot(doctorId, date);
  }
}
