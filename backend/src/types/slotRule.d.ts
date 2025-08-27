export interface DaySlot {
  start: string;
  duration: number;
  cancelled: boolean;
}

export interface CustomDayInput {
  date: string;
  leaveType: "full" | "break" | "custom";
  breaks?: string[];
  reason?: string;
  slots?: DaySlot[];
}

export interface SlotRule {
  customDays: CustomDayInput[];
}

export interface SlotRuleType {
  doctorId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  breaks: { start: string; end: string }[];
  effectiveFrom?: Date;
  effectiveTo?: Date;
  customDays?: {
    date: string;
    leaveType: "full" | "break";
    breaks?: { start: string; end: string }[];
    reason?: string;
  }[];
}
