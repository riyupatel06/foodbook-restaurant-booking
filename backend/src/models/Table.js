import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    tableId: { type: String, required: true },
    type: { type: String, required: true },
    city: { type: String, required: true },
    seats: { type: Number, required: true },
    floor: { type: String, default: "Ground" },
    price: { type: Number, required: true },
    status: { type: String, enum: ["available", "booked", "reserved", "occupied", "maintenance"], default: "available" },
    layout: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export const Table = mongoose.model("Table", tableSchema);
