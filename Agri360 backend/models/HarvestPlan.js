import mongoose from "mongoose";

const harvestPlanSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },

    // Plan Type
    planType: {
      type: String,
      enum: ["crop", "animal", "mixed"],
      default: "crop",
    },

    // Status tracking
    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "approved",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "draft",
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        notes: String,
      },
    ],

    // Crop details
    crop: String,
    cropArabic: String,
    crops: [
      {
        // For multi-crop plans
        name: String,
        nameArabic: String,
        areaHectares: Number,
        expectedYieldPerHa: Number,
      },
    ],

    // Animal details (for animal plans)
    animals: [
      {
        type: String,
        typeArabic: String,
        count: Number,
        purpose: String,
        expectedOutput: Number,
        outputUnit: String, // kg, liters, eggs, etc.
      },
    ],

    // Timeline
    season: { type: String, enum: ["winter", "summer", "nili"] },
    plantingDate: Date,
    harvestDate: Date,
    startDate: Date,
    endDate: Date,

    // Phases with tasks
    phases: [
      {
        name: String,
        nameArabic: String,
        startWeek: Number,
        endWeek: Number,
        startDate: Date,
        endDate: Date,
        tasks: [
          {
            task: String,
            taskArabic: String,
            deadline: Date,
            completed: { type: Boolean, default: false },
            completedAt: Date,
            notes: String,
          },
        ],
      },
    ],

    // Schedules
    irrigationSchedule: mongoose.Schema.Types.Mixed,
    fertilizerSchedule: mongoose.Schema.Types.Mixed,
    feedingSchedule: mongoose.Schema.Types.Mixed, // For animals

    // Expected outcomes
    expectedYield: Number,
    expectedYieldUnit: { type: String, default: "tonnes" },
    expectedRevenue: Number,
    expectedCosts: Number,
    expectedProfit: Number,

    // Actual outcomes (filled when completed)
    actualYield: Number,
    actualRevenue: Number,
    actualCosts: Number,
    actualProfit: Number,
    completionNotes: String,

    // AI generated content
    aiNotes: mongoose.Schema.Types.Mixed,
    aiNotesArabic: mongoose.Schema.Types.Mixed,

    // Linked business plan
    linkedBusinessPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessPlan",
    },

    // Language
    language: { type: String, enum: ["en", "ar"], default: "en" },
  },
  { timestamps: true }
);

// Index for efficient queries
harvestPlanSchema.index({ farmer: 1, status: 1 });
harvestPlanSchema.index({ farm: 1, season: 1 });

export default mongoose.model("HarvestPlan", harvestPlanSchema);
