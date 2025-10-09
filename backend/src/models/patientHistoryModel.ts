import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface PatientHistoryItem {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  doctorSpeciality: string;
  appointmentDate: Date;
  diagnosis: string;
  symptoms?: string;
  treatment?: string;
  prescription?: {
    items: Array<{
      name: string;
      dosage: string;
      instructions?: string;
    }>;
    notes?: string;
  };
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  followUpRequired?: boolean;
  followUpDate?: Date;
  notes?: string;
  createdAt: Date;
}

export interface PatientHistoryDocument extends Document {
  _id: Types.ObjectId;
  userId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientDob?: Date;
  patientGender?: string;
  medicalHistory: PatientHistoryItem[];
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VitalSignsSchema = new Schema({
  bloodPressure: { type: String },
  heartRate: { type: Number },
  temperature: { type: Number },
  weight: { type: Number },
  height: { type: Number },
}, { _id: false });

const PrescriptionItemSchema = new Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  instructions: { type: String },
}, { _id: false });

const PrescriptionSchema = new Schema({
  items: { type: [PrescriptionItemSchema], required: true },
  notes: { type: String },
}, { _id: false });

const EmergencyContactSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
}, { _id: false });

const PatientHistoryItemSchema = new Schema({
  appointmentId: { type: String, required: true, index: true },
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  doctorSpeciality: { type: String, required: true },
  appointmentDate: { type: Date, required: true },
  diagnosis: { type: String, required: true },
  symptoms: { type: String },
  treatment: { type: String },
  prescription: { type: PrescriptionSchema },
  vitalSigns: { type: VitalSignsSchema },
  followUpRequired: { type: Boolean, default: false },
  followUpDate: { type: Date },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const PatientHistorySchema = new Schema<PatientHistoryDocument>({
  userId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  patientPhone: { type: String, required: true },
  patientDob: { type: Date },
  patientGender: { type: String, enum: ['male', 'female', 'other'] },
  medicalHistory: { type: [PatientHistoryItemSchema], default: [] },
  allergies: { type: [String], default: [] },
  chronicConditions: { type: [String], default: [] },
  emergencyContact: { type: EmergencyContactSchema },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
PatientHistorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create compound indexes for efficient queries
PatientHistorySchema.index({ userId: 1, 'medicalHistory.appointmentDate': -1 });
PatientHistorySchema.index({ 'medicalHistory.doctorId': 1, 'medicalHistory.appointmentDate': -1 });

const patientHistoryModel: Model<PatientHistoryDocument> = mongoose.model<PatientHistoryDocument>(
  "patientHistory",
  PatientHistorySchema
);

export default patientHistoryModel;

