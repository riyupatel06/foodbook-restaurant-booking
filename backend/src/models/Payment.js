import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: String, required: true },
    provider: { type: String, default: "razorpay" },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "paid" },
    method: { type: String, default: "Razorpay" },
    transactionId: { type: String },
    payoutStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    payoutAt: { type: Date },
  },
  { timestamps: true },
);

export const Payment = mongoose.model("Payment", paymentSchema);
