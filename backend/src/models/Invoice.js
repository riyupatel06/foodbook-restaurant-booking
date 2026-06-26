import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: String, required: true },
    invoiceNo: { type: String, required: true, unique: true },
    subtotal: { type: Number, required: true },
    gst: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ["generated", "sent"], default: "generated" },
  },
  { timestamps: true },
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
