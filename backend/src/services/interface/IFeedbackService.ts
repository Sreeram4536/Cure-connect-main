import { FeedbackDTO } from "../implementation/FeedbackService";

export interface IFeedbackService {
  addFeedback(
    appointmentId: string,
    userId: string,
    rating: number,
    comment?: string
  ): Promise<FeedbackDTO>;

  listByDoctor(
    doctorId: string,
    page: number,
    limit: number
  ): Promise<{ items: FeedbackDTO[]; total: number; averageRating: number }>;
}
