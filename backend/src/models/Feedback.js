import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    foodRating: { type: Number },
    serviceRating: { type: Number },
    comment: { type: String },
    vendorReply: { type: String },
    reported: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Feedback = mongoose.model("Feedback", feedbackSchema);
