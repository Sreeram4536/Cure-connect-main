import mongoose, { Schema } from "mongoose";

const SlotRuleSchema = new Schema({
  doctorId: { type: Schema.Types.ObjectId, ref: "doctor", required: true, unique: true },
  daysOfWeek: [{ type: Number, required: true }], // 0=Sun, 1=Mon, ...
  startTime: { type: String, required: true },    
  endTime: { type: String, required: true },      
  slotDuration: { type: Number, required: true }, // in minutes
  breaks: [{ start: String, end: String }],       
  effectiveFrom: { type: Date },
  effectiveTo: { type: Date },
  customDays: [
    {
      date: { type: String, required: true }, // "YYYY-MM-DD"
      leaveType: { type: String, enum: ["full", "break", "custom"], required: true }, // add 'custom'
      breaks: [{ start: String, end: String }],
      reason: { type: String },
      slots: [
        {
          start: { type: String, required: true },
          duration: { type: Number, required: true },
          cancelled: { type: Boolean, default: false },
        }
      ]
    }
  ]
});

export default mongoose.model("slotRule", SlotRuleSchema);

