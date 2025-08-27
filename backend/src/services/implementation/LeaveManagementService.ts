import { ILeaveManagementService } from "../interface/ILeaveManagementService";
import appointmentModel from "../../models/appointmentModel";
import { WalletService } from "./WalletService";
import { IWalletService } from "../interface/IWalletService";

export class LeaveManagementService implements ILeaveManagementService {
  

  constructor(
    private walletService: IWalletService
  ) {
    
  }

  async handleDoctorLeave(doctorId: string, date: string, leaveType: 'full' | 'break' | 'custom'): Promise<{
    success: boolean;
    cancelledAppointments: number;
    refundedAmount: number;
    message: string;
  }> {
    try {
      console.log(`[LeaveManagementService] Handling doctor leave for doctorId: ${doctorId}, date: ${date}, leaveType: ${leaveType}`);

      // Find all appointments for this doctor on the specified date
      const appointments = await appointmentModel.find({
        docId: doctorId,
        slotDate: date,
        status: { $in: ['confirmed', 'pending'] },
        cancelled: { $ne: true }
      });

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

      // Process each appointment
      for (const appointment of appointments) {
        try {
          // Check if the appointment should be cancelled based on leave type
          if (leaveType === 'full') {
            // Full day leave - cancel all appointments
            await this.cancelAppointment(appointment);
            cancelledCount++;
            if (appointment.payment && appointment.amount > 0) {
              totalRefundedAmount += appointment.amount;
            }
          } else if (leaveType === 'break' || leaveType === 'custom') {
            // For break/custom leave, we need to check if the specific time slot is affected
            // This would require more complex logic based on the specific slots marked as leave
            // For now, we'll cancel all appointments for custom/break leave as well
            await this.cancelAppointment(appointment);
            cancelledCount++;
            if (appointment.payment && appointment.amount > 0) {
              totalRefundedAmount += appointment.amount;
            }
          }
        } catch (error) {
          console.error(`[LeaveManagementService] Error cancelling appointment ${appointment._id}:`, error);
          // Continue with other appointments even if one fails
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

  private async cancelAppointment(appointment: any): Promise<void> {
    try {
      console.log(`[LeaveManagementService] Cancelling appointment: ${appointment._id}`);

      // Update appointment status
      appointment.status = 'cancelled';
      appointment.cancelled = true;
      appointment.cancelledBy = 'doctor';
      appointment.cancelledAt = new Date();
      appointment.cancellationReason = 'Doctor marked day as leave';
      await appointment.save();

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

      // Send notification to user (you can implement this later)
      await this.sendCancellationNotification(appointment);

    } catch (error) {
      console.error(`[LeaveManagementService] Error cancelling appointment ${appointment._id}:`, error);
      throw error;
    }
  }

  private async sendCancellationNotification(appointment: any): Promise<void> {
    try {
      // Get doctor and user information for notification
      // We'll use the data already stored in the appointment
      const doctorName = appointment.docData?.name || 'Doctor';
      const userEmail = appointment.userData?.email;
      const slotDate = appointment.slotDate;
      const slotTime = appointment.slotTime;

      if (userEmail) {
        // You can implement email/SMS notification here
        console.log(`[LeaveManagementService] Sending cancellation notification to user: ${userEmail}`);
        console.log(`[LeaveManagementService] Appointment cancelled for doctor: ${doctorName} on ${slotDate} at ${slotTime}`);
        
        // TODO: Implement actual notification sending
        // await sendEmail(userEmail, 'Appointment Cancelled', `Your appointment with Dr. ${doctorName} on ${slotDate} at ${slotTime} has been cancelled due to doctor's leave.`);
      }
    } catch (error) {
      console.error(`[LeaveManagementService] Error sending cancellation notification:`, error);
      // Don't throw error for notification failures
    }
  }

  async checkAndHandleFutureLeaves(): Promise<void> {
    try {
      console.log(`[LeaveManagementService] Checking for future leaves that need appointment cancellations`);
      
      // This method can be called periodically to check for any leaves that were set
      // but appointments weren't cancelled at the time
      // Implementation would depend on your specific requirements
      
    } catch (error) {
      console.error(`[LeaveManagementService] Error checking future leaves:`, error);
    }
  }
}
