import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    code: { type: String, required: true, uppercase: true, trim: true },
    discount: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    validUntil: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Offer = mongoose.model("Offer", offerSchema);
