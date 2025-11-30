import mongoose from "mongoose";

const marketListingSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },

    // Product type
    productType: {
      type: String,
      enum: ["crop", "animal", "animal_product", "equipment", "service"],
      default: "crop",
    },

    // Basic info
    title: { type: String, required: true },
    titleArabic: { type: String },
    description: { type: String },
    descriptionArabic: { type: String },

    // Crop details (if productType is 'crop')
    crop: { type: String },
    cropArabic: { type: String },
    variety: { type: String }, // e.g., "Giza 168" for wheat
    harvestDate: { type: Date },
    quality: {
      type: String,
      enum: ["premium", "grade_a", "grade_b", "standard"],
    },

    // Animal details (if productType is 'animal')
    animalType: { type: String },
    animalTypeArabic: { type: String },
    breed: { type: String },
    age: { type: String }, // e.g., "6 months"
    weight: { type: Number }, // kg

    // Animal product details (if productType is 'animal_product')
    animalProductType: {
      type: String,
      enum: ["milk", "eggs", "meat", "wool", "honey", "cheese", "other"],
    },

    // Quantity and pricing
    quantity: { type: Number, required: true },
    unit: {
      type: String,
      enum: ["kg", "ton", "piece", "liter", "dozen", "head", "bag"],
      default: "kg",
    },
    pricePerUnit: { type: Number, required: true },
    currency: { type: String, default: "EGP" },
    negotiable: { type: Boolean, default: true },
    minimumOrder: { type: Number },

    // AI-powered pricing
    suggestedPrice: { type: Number }, // From Mahsoly/AI
    marketAveragePrice: { type: Number },
    priceAnalysis: {
      recommendation: String, // "price_high", "price_low", "price_fair"
      marketTrend: String, // "rising", "falling", "stable"
      bestSellingTime: String,
      competitorPriceRange: {
        min: Number,
        max: Number,
      },
    },

    // Location
    location: {
      governorate: { type: String, required: true },
      city: { type: String },
      address: { type: String },
      lat: { type: Number },
      lon: { type: Number },
    },

    // Delivery options
    delivery: {
      available: { type: Boolean, default: false },
      radius: { type: Number }, // km
      cost: { type: Number },
      method: {
        type: String,
        enum: ["pickup", "delivery", "both"],
        default: "pickup",
      },
    },

    // Images and media
    images: [{ type: String }],
    videos: [{ type: String }],

    // Status
    status: {
      type: String,
      enum: ["draft", "active", "pending", "sold", "expired", "removed"],
      default: "active",
    },

    // Linked plan (products from a harvest plan)
    linkedPlan: { type: mongoose.Schema.Types.ObjectId, ref: "HarvestPlan" },

    // Views and engagement
    viewCount: { type: Number, default: 0 },
    inquiryCount: { type: Number, default: 0 },
    favoriteCount: { type: Number, default: 0 },

    // Offers received
    offers: [
      {
        buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        offeredPrice: Number,
        quantity: Number,
        message: String,
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected", "expired"],
          default: "pending",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Verification
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Expiration
    expiresAt: { type: Date },

    // Tags for search
    tags: [{ type: String }],

    // Organic/Certification
    certifications: [
      {
        type: String,
        enum: ["organic", "gap", "fair_trade", "halal", "local"],
      },
    ],
  },
  { timestamps: true }
);

// Indexes
marketListingSchema.index({ farmer: 1, status: 1 });
marketListingSchema.index({ productType: 1, status: 1 });
marketListingSchema.index({ crop: 1, status: 1 });
marketListingSchema.index({ "location.governorate": 1, status: 1 });
marketListingSchema.index({ pricePerUnit: 1 });
marketListingSchema.index({ createdAt: -1 });

// Text search index
marketListingSchema.index({
  title: "text",
  description: "text",
  crop: "text",
  tags: "text",
});

export default mongoose.model("MarketListing", marketListingSchema);
