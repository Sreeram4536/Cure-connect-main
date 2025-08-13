export interface ILeaveManagementService {
  handleDoctorLeave(doctorId: string, date: string, leaveType: 'full' | 'break' | 'custom'): Promise<{
    success: boolean;
    cancelledAppointments: number;
    refundedAmount: number;
    message: string;
  }>;
  
  checkAndHandleFutureLeaves(): Promise<void>;
}
