import { SlotRuleType, DaySlot } from "../../types/slotRule";

export interface ISlotRuleService {
  getRule(doctorId: string): Promise<SlotRuleType | null>;
  setRule(doctorId: string, rule: Partial<SlotRuleType>): Promise<SlotRuleType>;
  updateCustomSlot(doctorId: string, date: string, start: string, duration: number): Promise<void>;
  cancelCustomSlot(doctorId: string, date: string, start: string): Promise<void>;
  setDayAsLeave(doctorId: string, date: string, leaveType: 'full' | 'break' | 'custom', slots?: DaySlot[]): Promise<void>;
  removeDayLeave(doctorId: string, date: string): Promise<void>;
}
