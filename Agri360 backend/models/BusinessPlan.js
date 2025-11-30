import mongoose from "mongoose";

const businessPlanSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farm",
      required: false,
    }, // Made optional for AI-generated plans

    // Plan title - user-friendly name
    title: {
      type: String,
      default: "Untitled Plan",
    },

    // Plan Type - extended to support all plan categories
    planType: {
      type: String,
      enum: ["crop", "animal", "mixed", "business", "farming", "market"],
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

    // What's being planned
    crop: String,
    cropArabic: String,
    crops: [{ name: String, nameArabic: String, areaHectares: Number }],
    animals: [
      { type: String, typeArabic: String, count: Number, purpose: String },
    ],

    // Financial Overview
    investmentCost: Number,
    expectedRevenue: Number,
    expectedProfit: Number,
    profitMargin: Number,
    roi: Number, // Return on Investment %
    breakEvenWeek: Number,

    // Detailed Costs
    costs: {
      seeds: Number,
      fertilizer: Number,
      pesticides: Number,
      labor: Number,
      irrigation: Number,
      machinery: Number,
      transport: Number,
      storage: Number,
      animalFeed: Number,
      veterinary: Number,
      other: Number,
      total: Number,
    },

    // Monthly Projections
    monthlyProjections: [
      {
        month: String,
        expenses: Number,
        income: Number,
        netCashFlow: Number,
        cumulativeCashFlow: Number,
      },
    ],

    // Timeline
    timeline: mongoose.Schema.Types.Mixed,
    durationMonths: Number,
    startDate: Date,
    endDate: Date,

    // Plan Phases with dates for calendar
    phases: [
      {
        name: String,
        nameArabic: String,
        description: String,
        descriptionArabic: String,
        startDate: Date,
        endDate: Date,
        status: {
          type: String,
          enum: ["pending", "in-progress", "completed"],
          default: "pending",
        },
        progress: { type: Number, default: 0 },
        tasks: [
          {
            task: String,
            taskArabic: String,
            dueDate: Date,
            completed: { type: Boolean, default: false },
          },
        ],
      },
    ],

    // Risk Analysis
    risks: [
      {
        risk: String,
        riskArabic: String,
        severity: { type: String, enum: ["high", "medium", "low"] },
        probability: Number, // percentage
        impact: Number, // EGP
        mitigation: String,
        mitigationArabic: String,
      },
    ],

    // Market Analysis
    marketAnalysis: {
      currentPrice: Number,
      expectedPrice: Number,
      priceUnit: String,
      demandLevel: { type: String, enum: ["high", "medium", "low"] },
      competitors: String,
      targetBuyers: [String],
      bestSellingPeriod: String,
    },

    // AI Generated Content
    aiAdvice: mongoose.Schema.Types.Mixed,
    aiAdviceArabic: mongoose.Schema.Types.Mixed,
    executiveSummary: String,
    executiveSummaryArabic: String,

    // Linked Harvest Plan
    linkedHarvestPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HarvestPlan",
    },

    // Actual Results (filled when completed)
    actualResults: {
      totalRevenue: Number,
      totalCosts: Number,
      totalProfit: Number,
      actualRoi: Number,
      lessonsLearned: String,
      lessonsLearnedArabic: String,
    },

    // Language
    language: { type: String, enum: ["en", "ar"], default: "en" },
  },
  { timestamps: true }
);

// Indexes
businessPlanSchema.index({ farmer: 1, status: 1 });
businessPlanSchema.index({ farm: 1, createdAt: -1 });

export default mongoose.model("BusinessPlan", businessPlanSchema);
