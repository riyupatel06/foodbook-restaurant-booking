import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    channels: [{ type: String, enum: ["text", "email"] }],
    status: { type: String, enum: ["queued", "sent", "failed"], default: "queued" },
    message: { type: String, required: true },
  },
  { timestamps: true },
);

export const Notification = mongoose.model("Notification", notificationSchema);
