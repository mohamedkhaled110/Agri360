import mongoose from "mongoose";

const forexRateSchema = new mongoose.Schema(
  {
    base: String,
    target: String,
    rate: Number,
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("ForexRate", forexRateSchema);
