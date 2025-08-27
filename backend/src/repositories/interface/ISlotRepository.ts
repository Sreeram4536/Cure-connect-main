
export interface ISlotRepository {
  getSlotsByDoctor(doctorId: string): Promise<any>;  

  getSlotsByMonth(
    doctorId: string, 
    year: number, 
    month: number
  ): Promise<any>;

  upsertSlot(
    doctorId: string,
    date: string,
    slots: { start: string; end: string }[],
    isCancelled: boolean
  ): Promise<any>;

  deleteSlot(doctorId: string, date: string): Promise<any>;
}
