export interface SlotTime {
    start: string;
    end: string;
  }
  
  export interface SlotView {
    date: string;
    start: string;
    end: string;
    baseDuration?: number;
    customDuration?: number;
    isBooked: boolean;
    isPast: boolean;
  }
  
  export interface ISlotService {
    // Returns computed monthly slot views for a doctor
    getMonthlySlots(doctorId: string, year: number, month: number): Promise<SlotView[]>;
  
    // Upserts slots for a specific date for a doctor
    updateDaySlot(
      doctorId: string,
      date: string,
      slots: SlotTime[],
      isCancelled: boolean
    ): Promise<unknown>;
  
    // Deletes slots for a specific date for a doctor
    deleteDaySlot(doctorId: string, date: string): Promise<unknown>;
  
    // Returns slot views for a specific date (derived from monthly slots)
    getSlotsForDate(doctorId: string, dateStr: string): Promise<SlotView[]>;
  }