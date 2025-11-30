import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Notification type for categorization
    type: {
      type: String,
      enum: [
        // Plan related
        "plan_reminder",
        "plan_task_due",
        "plan_phase_start",
        "plan_completed",
        "plan_approved",

        // Market related
        "market_price_alert",
        "market_listing_sold",
        "market_new_offer",
        "market_price_drop",
        "market_price_rise",

        // Weather related
        "weather_warning",
        "weather_optimal_planting",
        "weather_frost_alert",
        "weather_rain_expected",

        // Animal related
        "animal_feeding_reminder",
        "animal_health_check",
        "animal_breeding_time",
        "animal_vaccination_due",

        // Farm related
        "irrigation_reminder",
        "fertilizer_reminder",
        "harvest_reminder",
        "soil_test_reminder",

        // System
        "system_announcement",
        "subscription_expiring",
        "new_feature",
      ],
      default: "system_announcement",
    },

    // Priority level
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Content
    title: { type: String, required: true },
    titleArabic: { type: String },
    message: { type: String, required: true },
    messageArabic: { type: String },

    // Icon/Visual
    icon: { type: String }, // emoji or icon name
    color: { type: String }, // for UI styling

    // Status
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    dismissed: { type: Boolean, default: false },
    dismissedAt: { type: Date },

    // Action link
    actionUrl: { type: String }, // Where to navigate when clicked
    actionType: {
      type: String,
      enum: ["view_plan", "view_listing", "view_farm", "view_task", "external"],
    },

    // Related entities
    relatedPlan: { type: mongoose.Schema.Types.ObjectId, ref: "HarvestPlan" },
    relatedBusinessPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessPlan",
    },
    relatedListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketListing",
    },
    relatedFarm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },

    // Extra data
    meta: mongoose.Schema.Types.Mixed,

    // Scheduling
    scheduledFor: { type: Date }, // For scheduled notifications
    sentAt: { type: Date },
    deliveryChannel: {
      type: String,
      enum: ["in_app", "email", "sms", "push"],
      default: "in_app",
    },

    // Expiration
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.model("Notification", notificationSchema);
