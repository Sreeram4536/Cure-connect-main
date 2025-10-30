import { Types } from "mongoose";

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