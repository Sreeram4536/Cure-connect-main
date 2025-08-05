export interface LockSlotParams {
  userId: string;
  docId: string;
  slotDate: string;
  slotTime: string;
}

export interface AppointmentIdParam {
  appointmentId: string;
}

export interface ISlotLockService {
  lockSlot(data: LockSlotParams): Promise<{ success: boolean, appointmentId?: string, message?: string }>;
  releaseSlot(data: AppointmentIdParam): Promise<{ success: boolean, message?: string }>;
  confirmAppointment(data: AppointmentIdParam): Promise<{ success: boolean, message?: string }>;
  cancelAppointment(data: AppointmentIdParam): Promise<{ success: boolean, message?: string }>;
} 