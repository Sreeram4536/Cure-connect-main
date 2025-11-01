

import { IFeedbackRepository } from "../../repositories/interface/IFeedbackRepository";
import { IAppointmentRepository } from "../../repositories/interface/IAppointmentRepository";
import { FeedbackDocument } from "../../models/feedbackModel";
import { IUserRepository } from "../../repositories/interface/IUserRepository";
import { toFeedbackDTO } from "../../mapper/feedback.mapper";

export interface FeedbackDTO {
  id: string;
  appointmentId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
   userData?: {
    name: string;
    image?: string;
  };
}



export class FeedbackService {
  constructor(
    private feedbackRepo: IFeedbackRepository,
    private appointmentRepo: IAppointmentRepository,
    private userRepo: IUserRepository
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

    return toFeedbackDTO(created);
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

    const feedbackDTOs = await Promise.all(items.map(f => toFeedbackDTO(f)));

    return {
      items: feedbackDTOs,
      total,
      averageRating,
    };
  }
}

