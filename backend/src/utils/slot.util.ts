import { SlotRuleType } from "../types/slotRule";
import moment from "moment";

export function generateSlotsForDate(rule:SlotRuleType, slotDate:string) {
  const date = moment(slotDate, "YYYY-MM-DD");
  if (!rule.daysOfWeek.includes(date.day())) return [];

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

  const slots = [];
  while (current < end) {
    // Check if in break
    const inBreak = (rule.breaks || []).some((b) => {
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
        start: current.format("HH:mm"),
        end: current.clone().add(rule.slotDuration, "minutes").format("HH:mm")
      });
    }
    current = current.clone().add(rule.slotDuration, "minutes");
  }
  return slots;
}