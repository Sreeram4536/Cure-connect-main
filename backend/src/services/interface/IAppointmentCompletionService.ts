export interface IAppointmentCompletionService {
  completeAppointment(appointmentId: string): Promise<void>;
}