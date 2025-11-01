import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface PrescriptionItem {
  name: string;
  dosage: string;
  instructions?: string;
}

export interface PrescriptionDocument extends Document {
  appointmentId: string;
  doctorId: Types.ObjectId;
  userId: Types.ObjectId;
  items: PrescriptionItem[];
  notes?: string;
  createdAt: Date;
}

const PrescriptionItemSchema = new Schema<PrescriptionItem>({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  instructions: { type: String },
});

const PrescriptionSchema = new Schema<PrescriptionDocument>({
  appointmentId: { type: String, required: true, index: true, unique: true },
  // doctorId: { type: String, required: true, index: true },
  // userId: { type: String, required: true, index: true },
  doctorId: { type: Schema.Types.ObjectId, ref: "doctor", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "user", required: true, index: true },
  items: { type: [PrescriptionItemSchema], required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const prescriptionModel: Model<PrescriptionDocument> = mongoose.model<PrescriptionDocument>(
  "prescription",
  PrescriptionSchema
);

export default prescriptionModel;


