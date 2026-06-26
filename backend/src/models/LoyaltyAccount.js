import mongoose from "mongoose";

const loyaltyAccountSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    points: { type: Number, default: 0 },
    tier: { type: String, enum: ["Bronze", "Silver", "Gold", "Platinum"], default: "Bronze" },
    lifetimeSpent: { type: Number, default: 0 },
    lastRewardAt: { type: String },
  },
  { timestamps: true },
);

export const LoyaltyAccount = mongoose.model("LoyaltyAccount", loyaltyAccountSchema);
