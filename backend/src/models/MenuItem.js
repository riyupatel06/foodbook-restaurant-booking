import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    available: { type: Boolean, default: true },
    image: { type: String },
    tableType: { type: String, default: "Indoor" },
    isVeg: { type: Boolean, default: true },
    isCombo: { type: Boolean, default: false },
    isFestival: { type: Boolean, default: false },
    isTodaySpecial: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
