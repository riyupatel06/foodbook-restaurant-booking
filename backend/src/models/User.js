import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    picture: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    resetOtpHash: { type: String, default: null },
    resetOtpExpiresAt: { type: Date, default: null },
    role: { type: String, enum: ["user"], default: "user" },
    isBlocked: { type: Boolean, default: false },
    loyaltyPoints: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
