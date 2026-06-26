import mongoose from "mongoose";

const eventBookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    eventType: { type: String, enum: ["birthday", "party", "corporate"], required: true },
    eventName: { type: String, required: true, trim: true },
    guests: { type: Number, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    tables: [{ type: String }],
    combineTables: { type: Boolean, default: false },
    recurring: {
      frequency: { type: String, enum: ["none", "weekly", "monthly"], default: "none" },
      endsOn: { type: String },
    },
    notes: { type: String },
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  },
  { timestamps: true },
);

export const EventBooking = mongoose.model("EventBooking", eventBookingSchema);
