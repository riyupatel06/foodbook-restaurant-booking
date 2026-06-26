import mongoose from "mongoose";

const spinCouponSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    discount: { type: Number, required: true },
    status: { type: String, enum: ["won", "redeemed", "expired"], default: "won" },
    expiresAt: { type: String, required: true },
  },
  { timestamps: true },
);

export const SpinCoupon = mongoose.model("SpinCoupon", spinCouponSchema);
