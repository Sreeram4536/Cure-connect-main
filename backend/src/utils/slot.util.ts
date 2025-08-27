import { SlotRule, SlotRuleType, CustomDayInput } from "../types/slotRule";
import moment from "moment";
import { DoctorData } from "../types/doctor";
import { DoctorDocument } from "../types/doctor";

export function generateSlotsForDate(rule: SlotRuleType, slotDate: string) {
  const date = moment(slotDate, "YYYY-MM-DD");
  // Check for custom day (leave/partial leave)
  const customDay = (rule.customDays || []).find((cd: { date: string; leaveType: string; breaks?: { start: string; end: string }[] }) => cd.date === slotDate);
  if (customDay) {
    if (customDay.leaveType === "full") return [];
    // Partial leave: use custom breaks for this day
    let current = moment(date).set({
      hour: parseInt(rule.startTime.split(":")[0]),
      minute: parseInt(rule.startTime.split(":")[1]),
      second: 0,
      millisecond: 0,
    });
    const end = moment(date).set({
      hour: parseInt(rule.endTime.split(":")[0]),
      minute: parseInt(rule.endTime.split(":")[1]),
      second: 0,
      millisecond: 0,
    });
    const slots = [];
    while (current < end) {
      const inBreak = (customDay.breaks || []).some((b: { start: string; end: string }) => {
        const breakStart = moment(date).set({
          hour: parseInt(b.start.split(":")[0]),
          minute: parseInt(b.start.split(":")[1]),
        });
        const breakEnd = moment(date).set({
          hour: parseInt(b.end.split(":")[0]),
          minute: parseInt(b.end.split(":")[1]),
        });
        return current >= breakStart && current < breakEnd;
      });
      if (!inBreak) {
        slots.push({
          start: current.format("HH:mm"),
          end: current.clone().add(rule.slotDuration, "minutes").format("HH:mm"),
        });
      }
      current = current.clone().add(rule.slotDuration, "minutes");
    }
    return slots;
  }
  // Not a custom day: use general rule
  if (!rule.daysOfWeek.includes(date.day())) return [];
  let current = moment(date).set({
    hour: parseInt(rule.startTime.split(":")[0]),
    minute: parseInt(rule.startTime.split(":")[1]),
    second: 0,
    millisecond: 0,
  });
  const end = moment(date).set({
    hour: parseInt(rule.endTime.split(":")[0]),
    minute: parseInt(rule.endTime.split(":")[1]),
    second: 0,
    millisecond: 0,
  });
  const slots = [];
  while (current < end) {
    // Check if in break
    const inBreak = (rule.breaks || []).some((b: { start: string; end: string }) => {
      const breakStart = moment(date).set({
        hour: parseInt(b.start.split(":")[0]),
        minute: parseInt(b.start.split(":")[1]),
      });
      const breakEnd = moment(date).set({
        hour: parseInt(b.end.split(":")[0]),
        minute: parseInt(b.end.split(":")[1]),
      });
      return current >= breakStart && current < breakEnd;
    });
    if (!inBreak) {
      slots.push({
        start: current.format("HH:mm"),
        end: current.clone().add(rule.slotDuration, "minutes").format("HH:mm"),
      });
    }
    current = current.clone().add(rule.slotDuration, "minutes");
  }
  return slots;
}

export async function releaseSlotLock(
  doctor: DoctorDocument,
  slotDate: string,
  slotTime: string
): Promise<boolean> {
  if (doctor.slots_booked && typeof doctor.slots_booked === 'object') {
    const slots = doctor.slots_booked as { [date: string]: string[] };
    if (Array.isArray(slots[slotDate])) {
      const originalLength = slots[slotDate].length;
      slots[slotDate] = slots[slotDate].filter((t: string) => t !== slotTime);
      if (!slots[slotDate].length) delete slots[slotDate];
      doctor.slots_booked = slots;
      doctor.markModified("slots_booked");
      await doctor.save();
      return slots[slotDate]?.length !== originalLength;
    }
  }
  return false;
}