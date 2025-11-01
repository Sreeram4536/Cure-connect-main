import { FeedbackDTO } from "../dto/feedback.dto";
import { FeedbackDocument } from "../models/feedbackModel";

import userModel from "../models/userModel";

export  async function toFeedbackDTO(feedback: FeedbackDocument): Promise<FeedbackDTO>{
    const user = await userModel.findById(feedback.userId.toString());
    
    return {
      id: feedback._id.toString(),
      appointmentId: feedback.appointmentId.toString(),
      userId: feedback.userId.toString(),
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt,
      userData: user ? {
        name: user.name,
        image: user.image
      } : undefined
    };
  }