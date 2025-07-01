
export interface SlotRuleType {
  doctorId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  breaks: { start: string; end: string }[];
  effectiveFrom?: Date;
  effectiveTo?: Date;
}