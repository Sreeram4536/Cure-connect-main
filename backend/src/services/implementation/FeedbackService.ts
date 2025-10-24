// import { FeedbackRepository } from "../../repositories/implementation/FeedbackRepository";
// import appointmentModel from "../../models/appointmentModel";

// export class FeedbackService {
//   constructor(private repo: FeedbackRepository) {}

//   async addFeedback(appointmentId: string, userId: string, rating: number, comment?: string) {
//     const appt = await appointmentModel.findById(appointmentId);
//     if (!appt) throw new Error("Appointment not found");
//     if (String(appt.userId) !== String(userId)) throw new Error("Forbidden");
//     const existing = await this.repo.findByAppointment(appointmentId);
//     if (existing) throw new Error("Feedback already submitted");
//     return this.repo.create({ appointmentId, userId, rating, comment } as any);
//   }
// }

import { IFeedbackRepository } from "../../repositories/interface/IFeedbackRepository";
import { IAppointmentRepository } from "../../repositories/interface/IAppointmentRepository";
import { FeedbackDocument } from "../../models/feedbackModel";

export interface FeedbackDTO {
  id: string;
  appointmentId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export class FeedbackService {
  constructor(
    private feedbackRepo: IFeedbackRepository,
    private appointmentRepo: IAppointmentRepository
  ) {}

  async addFeedback(
    appointmentId: string,
    userId: string,
    rating: number,
    comment?: string
  ): Promise<FeedbackDTO> {
    const appt = await this.appointmentRepo.findById(appointmentId);
    if (!appt) throw new Error("Appointment not found");
    if (String(appt.userId) !== String(userId)) throw new Error("Forbidden");

    const existing = await this.feedbackRepo.findByAppointment(appointmentId);
    if (existing) throw new Error("Feedback already submitted");

    const created = await this.feedbackRepo.create({
      appointmentId,
      userId,
      rating,
      comment,
    });

    return this.toFeedbackDTO(created);
  }

  private toFeedbackDTO(feedback: FeedbackDocument): FeedbackDTO {
    return {
      id: feedback._id.toString(),
      appointmentId: feedback.appointmentId.toString(),
      userId: feedback.userId.toString(),
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt,
    };
  }

  async listByDoctor(
    doctorId: string,
    page: number,
    limit: number
  ): Promise<{ items: FeedbackDTO[]; total: number; averageRating: number }> {
    const appointments = await this.appointmentRepo.findAppointmentsByCriteria({
      docId: doctorId,
      payment: true,
      isCompleted: true,
    });

    const appointmentIds = appointments.map((a: any) => a._id?.toString()).filter(Boolean);
    if (appointmentIds.length === 0) {
      return { items: [], total: 0, averageRating: 0 };
    }

    const { items, total, averageRating } = await this.feedbackRepo.findByAppointmentIds(
      appointmentIds,
      page,
      limit
    );

    return {
      items: items.map((f) => this.toFeedbackDTO(f)),
      total,
      averageRating,
    };
  }
}

