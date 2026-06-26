import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    cuisine: { type: String, required: true, trim: true },
    vibe: { type: String, trim: true },
    rating: { type: Number, default: 0 },
    image: { type: String },
    images: [{ type: String }],
    description: { type: String },
    facilities: [{ type: String }],
    isActive: { type: Boolean, default: true },
    branchCode: { type: String, trim: true },
  },
  { timestamps: true },
);

export const Restaurant = mongoose.model("Restaurant", restaurantSchema);
