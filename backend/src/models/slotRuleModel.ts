import mongoose, { Schema } from "mongoose";

const SlotRuleSchema = new Schema({
  doctorId: { type: Schema.Types.ObjectId, ref: "doctor", required: true, unique: true },
  daysOfWeek: [{ type: Number, required: true }], // 0=Sun, 1=Mon, ...
  startTime: { type: String, required: true },    // "09:00"
  endTime: { type: String, required: true },      // "17:00"
  slotDuration: { type: Number, required: true }, // in minutes
  breaks: [{ start: String, end: String }],       // optional
  effectiveFrom: { type: Date },
  effectiveTo: { type: Date }
});

export default mongoose.model("slotRule", SlotRuleSchema);

