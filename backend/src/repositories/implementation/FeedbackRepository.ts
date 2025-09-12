import feedbackModel, { FeedbackDocument } from "../../models/feedbackModel";

export class FeedbackRepository {
  async create(data: Omit<FeedbackDocument, keyof Document | "_id" | "createdAt">): Promise<FeedbackDocument> {
    const doc = await feedbackModel.create(data as any);
    return doc;
  }

  async findByAppointment(appointmentId: string): Promise<FeedbackDocument | null> {
    return feedbackModel.findOne({ appointmentId });
  }
}


