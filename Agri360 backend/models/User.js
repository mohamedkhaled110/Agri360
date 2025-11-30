import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String },

    // Role and language
    role: {
      type: String,
      enum: ["farmer", "buyer", "admin", "expert"],
      default: "farmer",
    },
    lang: { type: String, enum: ["en", "ar"], default: "en" },

    // Location
    country: { type: String, default: "Egypt" },
    governorate: { type: String },
    city: { type: String },

    // Farm reference
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },
    farms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Farm" }], // Multiple farms support

    // Notification Preferences
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      // What to notify about
      planReminders: { type: Boolean, default: true },
      marketAlerts: { type: Boolean, default: true },
      weatherWarnings: { type: Boolean, default: true },
      priceChanges: { type: Boolean, default: true },
      animalCareReminders: { type: Boolean, default: true },
      taskDeadlines: { type: Boolean, default: true },
    },

    // Dashboard Preferences
    dashboardPreferences: {
      defaultView: {
        type: String,
        enum: ["overview", "plans", "market", "weather"],
        default: "overview",
      },
      showWeather: { type: Boolean, default: true },
      showMarketPrices: { type: Boolean, default: true },
      showTasks: { type: Boolean, default: true },
      showAlerts: { type: Boolean, default: true },
      favoriteCrops: [String],
      favoriteAnimals: [String],
    },

    // Activity tracking
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 },

    // Plan history summary (for quick access)
    planStats: {
      totalCropPlans: { type: Number, default: 0 },
      completedCropPlans: { type: Number, default: 0 },
      totalBusinessPlans: { type: Number, default: 0 },
      completedBusinessPlans: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 }, // percentage
    },

    // Marketplace stats
    marketplaceStats: {
      totalListings: { type: Number, default: 0 },
      activeListings: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },

    // Verification status
    isVerified: { type: Boolean, default: false },
    verificationDate: { type: Date },

    // Subscription/Premium features
    subscription: {
      plan: {
        type: String,
        enum: ["free", "basic", "premium", "enterprise"],
        default: "free",
      },
      startDate: Date,
      endDate: Date,
      features: [String],
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries (email index is already created by unique: true)
userSchema.index({ governorate: 1 });
userSchema.index({ role: 1 });

export default mongoose.model("User", userSchema);
