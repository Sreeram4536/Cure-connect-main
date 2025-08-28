import { SlotRepository } from "../../repositories/implementation/SlotRepository";
import { SlotRuleRepository } from "../../repositories/implementation/SlotRuleRepository";
import appointmentModel from "../../models/appointmentModel";
import { ISlotRepository } from "../../repositories/interface/ISlotRepository";
import { ISlotRuleRepository } from "../../repositories/interface/ISlotRuleRepository";
import { DaySlot } from "../../types/slotRule";

// Define proper types for slots
interface TimeSlot {
  date: string;
  start: string;
  end: string;
  baseDuration?: number;
  customDuration?: number;
  isBooked: boolean;
  isPast: boolean;
}

interface BreakTime {
  start: string;
  end: string;
}

// Use the correct break type that matches the data structure
interface CustomDayWithSlots {
  date: string;
  leaveType: "full" | "break" | "custom";
  breaks?: BreakTime[];
  reason?: string;
  slots?: DaySlot[];
}

export class DoctorSlotService {
  constructor(
    private readonly _slotRepo: ISlotRepository,
    private readonly _ruleRepo :ISlotRuleRepository
  ) {}

  // Helper method to format date as YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper method to check if a time slot is in the past
  private isTimeSlotInPast(dateStr: string, timeStr: string): boolean {
    const now = new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    const slotDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);
    
    // Add a small buffer (5 minutes) to account for booking time and timezone differences
    const bufferTime = new Date(now.getTime() + 5 * 60 * 1000);
    
    return slotDateTime <= bufferTime;
  }

  // Helper method to check if date is before today
  private isDateBeforeToday(dateStr: string): boolean {
    const today = new Date();
    const todayStr = this.formatDate(today);
    return dateStr < todayStr;
  }

  // Helper method to check if date is today
  private isDateToday(dateStr: string): boolean {
    const today = new Date();
    const todayStr = this.formatDate(today);
    return dateStr === todayStr;
  }

  async getMonthlySlots(doctorId: string, year: number, month: number) {
    // 1. Get rule
    const rule = await this._ruleRepo.getRuleByDoctor(doctorId);
    if (!rule) return [];

    const daysInMonth = new Date(year, month, 0).getDate();
    const slots = [];
    
    // Get all booked appointments for this doctor in this month
    const startDate = this.formatDate(new Date(year, month - 1, 1));
    const endDate = this.formatDate(new Date(year, month, 0));
    
    const bookedAppointments = await appointmentModel.find({
      docId: doctorId,
      slotDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'pending'] },
      cancelled: { $ne: true }
    }).select('slotDate slotTime status');
    
    // Create a map of booked slots for quick lookup
    const bookedSlotsMap: Record<string, Set<string>> = {};
    bookedAppointments.forEach(appointment => {
      if (!bookedSlotsMap[appointment.slotDate]) {
        bookedSlotsMap[appointment.slotDate] = new Set();
      }
      bookedSlotsMap[appointment.slotDate].add(appointment.slotTime);
    });
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const dateStr = this.formatDate(dateObj);
      
      // Check for custom day
      const customDay = (rule.customDays || []).find((cd: CustomDayWithSlots) => cd.date === dateStr);
      
      // --- MERGE LOGIC: Merge customDay.slots with default slots ---
      // 1. Generate default slots for the day
      let defaultSlots: TimeSlot[] = [];
      if (!customDay || customDay.leaveType !== 'full') {
        const [startHour, startMinute] = rule.startTime.split(":").map(Number);
        const [endHour, endMinute] = rule.endTime.split(":").map(Number);
        
        let current = new Date(dateObj);
        current.setHours(startHour, startMinute, 0, 0);
        
        const end = new Date(dateObj);
        end.setHours(endHour, endMinute, 0, 0);
        
        while (current < end) {
          // Use custom breaks for partial leave, else rule breaks
          const breaks = (customDay && customDay.leaveType === 'break') ? (customDay.breaks || []) : (rule.breaks || []);
          const inBreak = breaks.some((b: BreakTime) => {
            const [breakStartHour, breakStartMinute] = b.start.split(":").map(Number);
            const [breakEndHour, breakEndMinute] = b.end.split(":").map(Number);
            
            const breakStart = new Date(dateObj);
            breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);
            
            const breakEnd = new Date(dateObj);
            breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);
            
            return current >= breakStart && current < breakEnd;
          });
          if (!inBreak) {
            const slotStart = current.toTimeString().slice(0, 5);
            const isBooked = bookedSlotsMap[dateStr]?.has(slotStart) || false;
            const isPast = this.isTimeSlotInPast(dateStr, slotStart);
            
            const endTime = new Date(current.getTime() + rule.slotDuration * 60 * 1000);
            defaultSlots.push({
              date: dateStr,
              start: slotStart,
              end: endTime.toTimeString().slice(0, 5),
              baseDuration: rule.slotDuration,
              isBooked: isBooked,
              isPast: isPast
            });
          }
          current = new Date(current.getTime() + rule.slotDuration * 60 * 1000);
        }
      }
      
      // 2. If customDay.slots exists, merge
      if (customDay && Array.isArray(customDay.slots) && customDay.slots.length > 0) {
        // Map custom slots by start time
        const customSlotMap: Record<string, DaySlot> = {};
        for (const slot of customDay.slots) {
          customSlotMap[slot.start] = slot;
        }
        // Merge: override or skip default slots
        const mergedSlots = [];
        for (const defSlot of defaultSlots) {
          const custom = customSlotMap[defSlot.start];
          if (custom) {
            if (custom.cancelled) continue; // skip cancelled
            const isBooked = bookedSlotsMap[dateStr]?.has(defSlot.start) || false;
            const isPast = this.isTimeSlotInPast(dateStr, defSlot.start);
            const endTime = new Date(`${defSlot.date}T${defSlot.start}`);
            endTime.setMinutes(endTime.getMinutes() + custom.duration);
            mergedSlots.push({
              ...defSlot,
              end: endTime.toTimeString().slice(0, 5),
              customDuration: custom.duration,
              isBooked: isBooked,
              isPast: isPast
            });
            delete customSlotMap[defSlot.start];
          } else {
            mergedSlots.push(defSlot);
          }
        }
        // Add any new custom slots not in default
        for (const slot of Object.values(customSlotMap)) {
          if (!slot.cancelled) {
            const isBooked = bookedSlotsMap[dateStr]?.has(slot.start) || false;
            const isPast = this.isTimeSlotInPast(dateStr, slot.start);
            const endTime = new Date(`${dateStr}T${slot.start}`);
            endTime.setMinutes(endTime.getMinutes() + slot.duration);
            mergedSlots.push({
              date: dateStr,
              start: slot.start,
              end: endTime.toTimeString().slice(0, 5),
              customDuration: slot.duration,
              isBooked: isBooked,
              isPast: isPast
            });
          }
        }
        // Sort by start time
        mergedSlots.sort((a, b) => a.start.localeCompare(b.start));
        slots.push(...mergedSlots);
        continue;
      }
      
      // --- END MERGE LOGIC ---
      // If full day leave, skip
      if (customDay && customDay.leaveType === 'full') continue;
      // If partial leave, already handled in defaultSlots above
      // Not a custom day: use general rule
      if (!rule.daysOfWeek.includes(dateObj.getDay())) continue;
      slots.push(...defaultSlots);
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

  // Get slots for a specific date with validation
  async getSlotsForDate(doctorId: string, dateStr: string): Promise<TimeSlot[]> {
    // Get the year and month for the date
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    // Get all slots for the month
    const monthlySlots = await this.getMonthlySlots(doctorId, year, month);

    // Filter slots for the specific date
    const dateSlots = monthlySlots.filter(slot => slot.date === dateStr);

    return dateSlots;
  }
}
