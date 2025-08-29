import { ILeaveManagementService } from "../interface/ILeaveManagementService";
import { IWalletService } from "../interface/IWalletService";
import { ILeaveManagementRepository } from "../../repositories/interface/ILeaveManagementRepository";
import { AppointmentDocument } from "../../types/appointment";

export class LeaveManagementService implements ILeaveManagementService {
  constructor(
    private walletService: IWalletService,
    private leaveManagementRepository: ILeaveManagementRepository
  ) {}

  async handleDoctorLeave(doctorId: string, date: string, leaveType: 'full' | 'break' | 'custom'): Promise<{
    success: boolean;
    cancelledAppointments: number;
    refundedAmount: number;
    message: string;
  }> {
    try {
     
      const appointments = await this.leaveManagementRepository.findAppointmentsByDoctorAndDate(doctorId, date);

      if (appointments.length === 0) {
        return {
          success: true,
          cancelledAppointments: 0,
          refundedAmount: 0,
          message: "No appointments found for the specified date"
        };
      }

      let cancelledCount = 0;
      let totalRefundedAmount = 0;

      
      for (const appointment of appointments) {
        try {
          
          if (leaveType === 'full') {
            
            await this.cancelAppointment(appointment);
            cancelledCount++;
            if (appointment.payment && appointment.amount > 0) {
              totalRefundedAmount += appointment.amount;
            }
          } else if (leaveType === 'break' || leaveType === 'custom') {
      
            await this.cancelAppointment(appointment);
            cancelledCount++;
            if (appointment.payment && appointment.amount > 0) {
              totalRefundedAmount += appointment.amount;
            }
          }
        } catch (error) {
          console.error(`[LeaveManagementService] Error cancelling appointment ${appointment._id}:`, error);
          
        }
      }

      console.log(`[LeaveManagementService] Leave handling completed. Cancelled: ${cancelledCount}, Refunded: ${totalRefundedAmount}`);

      return {
        success: true,
        cancelledAppointments: cancelledCount,
        refundedAmount: totalRefundedAmount,
        message: `Successfully cancelled ${cancelledCount} appointments and refunded ₹${totalRefundedAmount}`
      };

    } catch (error) {
      console.error(`[LeaveManagementService] Error handling doctor leave:`, error);
      throw new Error(`Failed to handle doctor leave: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async cancelAppointment(appointment: AppointmentDocument): Promise<void> {
    try {
      console.log(`[LeaveManagementService] Cancelling appointment: ${appointment._id}`);

      
      await this.leaveManagementRepository.updateAppointmentStatus(appointment._id.toString(), {
        status: 'cancelled',
        cancelled: true,
        cancelledBy: 'doctor',
        cancelledAt: new Date(),
        cancellationReason: 'Doctor marked day as leave'
      });

      // Process refund if payment was made
      if (appointment.payment && appointment.amount > 0) {
        console.log(`[LeaveManagementService] Processing refund for appointment: ${appointment._id}, amount: ${appointment.amount}`);
        await this.walletService.processAppointmentCancellation(
          appointment.userId,
          appointment._id.toString(),
          appointment.amount,
          'doctor'
        );
      }

      
      await this.sendCancellationNotification(appointment);

    } catch (error) {
      console.error(`[LeaveManagementService] Error cancelling appointment ${appointment._id}:`, error);
      throw error;
    }
  }

  private async sendCancellationNotification(appointment: AppointmentDocument): Promise<void> {
    try {
      
      const doctorName = appointment.docData?.name || 'Doctor';
      const userEmail = appointment.userData?.email;
      const slotDate = appointment.slotDate;
      const slotTime = appointment.slotTime;

      if (userEmail) {
        
        console.log(`[LeaveManagementService] Sending cancellation notification to user: ${userEmail}`);
        console.log(`[LeaveManagementService] Appointment cancelled for doctor: ${doctorName} on ${slotDate} at ${slotTime}`);
        
        
      }
    } catch (error) {
      console.error(`[LeaveManagementService] Error sending cancellation notification:`, error);
      
    }
  }

  async checkAndHandleFutureLeaves(): Promise<void> {
    try {
      console.log(`[LeaveManagementService] Checking for future leaves that need appointment cancellations`);
      
    } catch (error) {
      console.error(`[LeaveManagementService] Error checking future leaves:`, error);
    }
  }
}
