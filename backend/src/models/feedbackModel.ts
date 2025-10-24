import mongoose, { Document, Model, Schema,Types } from "mongoose";

export interface FeedbackDocument extends Document {
  _id: Types.ObjectId; 
  appointmentId: string;
  userId: string;
  rating: number; 
  comment?: string;
  createdAt: Date;
}

const FeedbackSchema = new Schema<FeedbackDocument>({
  appointmentId: { type: String, required: true, index: true, unique: true },
  userId: { type: String, required: true, index: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const feedbackModel: Model<FeedbackDocument> = mongoose.model<FeedbackDocument>(
  "feedback",
  FeedbackSchema
);

export default feedbackModel;


