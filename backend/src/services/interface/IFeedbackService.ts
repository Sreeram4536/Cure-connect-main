import { FeedbackDTO } from "../implementation/FeedbackService";

export interface IFeedbackService {
  addFeedback(
    appointmentId: string,
    userId: string,
    rating: number,
    comment?: string
  ): Promise<FeedbackDTO>;
}
