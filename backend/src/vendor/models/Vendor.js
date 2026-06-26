import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    businessName: { type: String, required: true, trim: true },
    logo: { type: String, default: "" },
    isBlocked: { type: Boolean, default: false },
    role: { type: String, default: "vendor" },
  },
  { timestamps: true },
);

export const Vendor = mongoose.model("Vendor", vendorSchema);
