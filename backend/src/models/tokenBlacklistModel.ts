import mongoose, { Schema, Document, Model } from "mongoose";

export interface BlacklistedTokenDocument extends Document {
  token: string;
  expiresAt: Date;
}

const blacklistedTokenSchema: Schema<BlacklistedTokenDocument> = new Schema({
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});


blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BlacklistedToken: Model<BlacklistedTokenDocument> = mongoose.model<BlacklistedTokenDocument>(
  "BlacklistedToken",
  blacklistedTokenSchema
);

export default BlacklistedToken; 