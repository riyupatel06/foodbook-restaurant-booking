import mongoose from "mongoose";

const recurringBookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    frequency: { type: String, enum: ["weekly", "monthly"], required: true },
    nextRun: { type: String, required: true },
    groupId: { type: String },
    totalOccurrences: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const RecurringBooking = mongoose.model("RecurringBooking", recurringBookingSchema);
