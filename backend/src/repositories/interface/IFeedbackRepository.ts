import { FeedbackDocument } from "../../models/feedbackModel";

export interface IFeedbackRepository {
  create(
    data: Pick<FeedbackDocument, "appointmentId" | "userId" | "rating" | "comment">
  ): Promise<FeedbackDocument>;

  findByAppointment(appointmentId: string): Promise<FeedbackDocument | null>;

  findByAppointmentIds(
    appointmentIds: string[],
    page: number,
    limit: number
  ): Promise<{ items: FeedbackDocument[]; total: number; averageRating: number }>;
}
