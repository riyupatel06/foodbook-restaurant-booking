import mongoose from "mongoose";

const aiLogSchema = new mongoose.Schema(
  {
    userId: { type: String },
    query: { type: String, required: true },
    response: { type: String, required: true },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

export const AiLog = mongoose.model("AiLog", aiLogSchema);
