import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema(
  {
    source: String,
    crop: String,
    date: Date,
    price: Number,
    currency: String,
  },
  { timestamps: true }
);

export default mongoose.model("PriceHistory", priceHistorySchema);
