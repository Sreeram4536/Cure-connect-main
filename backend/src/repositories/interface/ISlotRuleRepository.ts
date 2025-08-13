export interface ISlotRuleRepository {
  getRuleByDoctor(doctorId: string): Promise<any>;
  upsertRule(doctorId: string, rule: any): Promise<any>;
  updateCustomSlot(doctorId: string, date: string, start: string, duration: number): Promise<any>;
  cancelCustomSlot(doctorId: string, date: string, start: string): Promise<any>;
  setDayAsLeave(doctorId: string, date: string, leaveType: 'full' | 'break' | 'custom', slots?: any[]): Promise<any>;
  removeDayLeave(doctorId: string, date: string): Promise<any>;
}
