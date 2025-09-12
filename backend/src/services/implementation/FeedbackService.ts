import { FeedbackRepository } from "../../repositories/implementation/FeedbackRepository";
import appointmentModel from "../../models/appointmentModel";

export class FeedbackService {
  constructor(private repo: FeedbackRepository) {}

  async addFeedback(appointmentId: string, userId: string, rating: number, comment?: string) {
    const appt = await appointmentModel.findById(appointmentId);
    if (!appt) throw new Error("Appointment not found");
    if (String(appt.userId) !== String(userId)) throw new Error("Forbidden");
    const existing = await this.repo.findByAppointment(appointmentId);
    if (existing) throw new Error("Feedback already submitted");
    return this.repo.create({ appointmentId, userId, rating, comment } as any);
  }
}


