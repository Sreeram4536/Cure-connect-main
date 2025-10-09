// import feedbackModel, { FeedbackDocument } from "../../models/feedbackModel";

// export class FeedbackRepository {
//   async create(data: Omit<FeedbackDocument, keyof Document | "_id" | "createdAt">): Promise<FeedbackDocument> {
//     const doc = await feedbackModel.create(data as any);
//     return doc;
//   }

//   async findByAppointment(appointmentId: string): Promise<FeedbackDocument | null> {
//     return feedbackModel.findOne({ appointmentId });
//   }
// }


import feedbackModel, { FeedbackDocument } from "../../models/feedbackModel";
import { IFeedbackRepository } from "../interface/IFeedbackRepository";


export class FeedbackRepository implements IFeedbackRepository {
  async create(
    data: Pick<FeedbackDocument, "appointmentId" | "userId" | "rating" | "comment">
  ): Promise<FeedbackDocument> {
    return feedbackModel.create(data);
  }

  async findByAppointment(
    appointmentId: string
  ): Promise<FeedbackDocument | null> {
    return feedbackModel.findOne({ appointmentId });
  }

  async findByAppointmentIds(
    appointmentIds: string[],
    page: number,
    limit: number
  ): Promise<{ items: FeedbackDocument[]; total: number; averageRating: number }> {
    const query = { appointmentId: { $in: appointmentIds } } as any;
    const skip = (page - 1) * limit;

    const [items, total, avg] = await Promise.all([
      feedbackModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      feedbackModel.countDocuments(query),
      feedbackModel.aggregate([
        { $match: query },
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ]),
    ]);

    const averageRating = Array.isArray(avg) && avg.length > 0 ? avg[0].avg || 0 : 0;

    return { items, total, averageRating };
  }
}
