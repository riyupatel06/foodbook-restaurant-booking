import mongoose from "mongoose";

const adminDealSchema = new mongoose.Schema(
  {
    audience: { type: String, enum: ["user", "vendor"], required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    code: { type: String, trim: true, uppercase: true, default: "" },
    discount: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    validUntil: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const AdminDeal = mongoose.model("AdminDeal", adminDealSchema);
