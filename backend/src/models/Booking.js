import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    restaurantName: { type: String, required: true },
    city: { type: String, required: true },
    customerName: { type: String },
    customerEmail: { type: String },
    customerPhone: { type: String },
    tableId: { type: String, required: true },
    tableType: { type: String, required: true },
    splitTableBooking: { type: Boolean, default: false },
    linkedTableIds: [{ type: String }],
    assignedTables: [{ type: String }],
    guests: { type: String },
    date: { type: String, required: true },
    time: { type: String, required: true },
    slot: { type: String, enum: ["morning", "lunch", "dinner"], default: "dinner" },
    qrCode: { type: String },
    checkInStatus: { type: String, enum: ["pending", "verified", "assigned"], default: "pending" },
    bookingMode: { type: String, default: "standard" },
    notes: { type: String },
    waitlistPosition: { type: Number, default: null },
    recurringGroupId: { type: String },
    lastMinuteDiscount: { type: Number, default: 0 },
    items: [
      {
        name: String,
        quantity: Number,
        price: Number,
      },
    ],
    status: { type: String, enum: ["pending", "confirmed", "waitlist", "cancelled", "checked_in", "completed"], default: "pending" },
  },
  { timestamps: true },
);

export const Booking = mongoose.model("Booking", bookingSchema);
