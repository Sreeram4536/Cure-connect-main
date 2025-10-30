import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { AppointmentTypes } from "../types/appointment";

export interface AppointmentDocument extends AppointmentTypes, Document {
  _id: Types.ObjectId;
}

const appointmentSchema: Schema<AppointmentDocument> = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  docId: {
    type: String,
    required: true,
  },

  slotDate: {
    type: String,
    required: true,
  },

  slotTime: {
    type: String,
    required: true,
  },

  userData: {
    type: Object,
    required: true,
  },

  docData: {
    type: Object,
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },

  cancelled: {
    type: Boolean,
    default: false,
  },

  payment: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending"
  },
  lockExpiresAt: {
    type: Date,
    default: null
  },

  isConfirmed: {
    type: Boolean,
    default: false,
  },

  isCompleted: {
    type: Boolean,
    default: false,
  },

  razorpayOrderId: {
    type: String,
    default: null,
  },

  // New fields for cancellation tracking
  cancelledBy: {
    type: String,
    enum: ["user", "doctor", "admin"],
    default: null,
  },

  cancelledAt: {
    type: Date,
    default: null,
  },

  cancellationReason: {
    type: String,
    default: null,
  },
});

const appointmentModel: Model<AppointmentDocument> =
  mongoose.model<AppointmentDocument>("appointment", appointmentSchema);

export default appointmentModel;
