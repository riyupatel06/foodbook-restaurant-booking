import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    userId: { type: String },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    guests: { type: Number, default: 2 },
    position: { type: Number, default: 1 },
    date: { type: String, required: true },
    time: { type: String, required: true },
    slot: { type: String, enum: ["morning", "lunch", "dinner"], default: "dinner" },
    tableType: { type: String, trim: true },
    estimatedWait: { type: String, default: "20 mins" },
    status: { type: String, enum: ["waiting", "notified", "seated", "cancelled"], default: "waiting" },
  },
  { timestamps: true },
);

export const Waitlist = mongoose.model("Waitlist", waitlistSchema);
