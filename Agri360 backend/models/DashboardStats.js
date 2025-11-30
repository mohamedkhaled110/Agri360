import mongoose from "mongoose";

const dashboardStatsSchema = new mongoose.Schema(
  {
    // Can be global or user-specific
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },
    isGlobal: { type: Boolean, default: false }, // true for system-wide stats

    date: { type: Date, default: Date.now },

    // ============ PLAN TRACKING ============
    planStats: {
      activeCropPlans: { type: Number, default: 0 },
      activeBusinessPlans: { type: Number, default: 0 },
      completedPlansThisMonth: { type: Number, default: 0 },
      upcomingTasks: { type: Number, default: 0 },
      overdueTasks: { type: Number, default: 0 },
      planSuccessRate: { type: Number, default: 0 }, // percentage
    },

    // ============ FARM PERFORMANCE ============
    farmPerformance: {
      totalAreaHectares: { type: Number, default: 0 },
      activeAreaHectares: { type: Number, default: 0 },
      currentCrops: [
        {
          crop: String,
          areaHectares: Number,
          stage: String, // planting, growing, harvesting
          healthScore: Number, // 0-100
        },
      ],
      currentAnimals: [
        {
          type: String,
          count: Number,
          healthScore: Number,
          productionRate: Number, // e.g., liters/day for dairy
        },
      ],
      yieldComparison: {
        thisYear: Number,
        lastYear: Number,
        changePercent: Number,
      },
    },

    // ============ FINANCIAL OVERVIEW ============
    financials: {
      totalInvestmentThisSeason: { type: Number, default: 0 },
      expectedRevenueThisSeason: { type: Number, default: 0 },
      expectedProfitThisSeason: { type: Number, default: 0 },
      actualRevenueToDate: { type: Number, default: 0 },
      actualCostsToDate: { type: Number, default: 0 },
      cashFlowStatus: {
        type: String,
        enum: ["positive", "negative", "neutral"],
        default: "neutral",
      },
      monthlyBreakdown: [
        {
          month: String,
          expenses: Number,
          income: Number,
          profit: Number,
        },
      ],
    },

    // ============ MARKET DATA ============
    marketData: {
      cropPrices: [
        {
          crop: String,
          cropArabic: String,
          currentPrice: Number,
          previousPrice: Number,
          change: Number,
          changePercent: Number,
          trend: { type: String, enum: ["up", "down", "stable"] },
          unit: String,
        },
      ],
      animalPrices: [
        {
          animal: String,
          animalArabic: String,
          currentPrice: Number,
          unit: String,
          trend: String,
        },
      ],
      forexRate: {
        usdToEgp: Number,
        previousRate: Number,
        change: Number,
      },
      oilPrice: {
        brent: Number,
        previousPrice: Number,
        impactOnFarming: String, // "high", "medium", "low"
      },
    },

    // ============ WEATHER IMPACT ============
    weatherData: {
      current: {
        temp: Number,
        humidity: Number,
        condition: String,
        windSpeed: Number,
      },
      forecast7Day: [
        {
          date: Date,
          maxTemp: Number,
          minTemp: Number,
          rainChance: Number,
          condition: String,
        },
      ],
      alerts: [
        {
          type: String,
          severity: String,
          message: String,
          messageArabic: String,
        },
      ],
      farmingCondition: {
        type: String,
        enum: ["excellent", "good", "fair", "poor", "critical"],
      },
    },

    // ============ MARKETPLACE STATS ============
    marketplaceStats: {
      activeListings: { type: Number, default: 0 },
      pendingOrders: { type: Number, default: 0 },
      recentSales: { type: Number, default: 0 },
      totalMarketplaceRevenue: { type: Number, default: 0 },
      topSellingCrops: [
        {
          crop: String,
          quantity: Number,
          revenue: Number,
        },
      ],
    },

    // ============ ALERTS & RECOMMENDATIONS ============
    alerts: [
      {
        type: String,
        severity: { type: String, enum: ["info", "warning", "critical"] },
        title: String,
        titleArabic: String,
        message: String,
        messageArabic: String,
        actionRequired: Boolean,
        actionUrl: String,
      },
    ],

    // AI-generated recommendations
    aiRecommendations: [
      {
        category: String, // "crop", "market", "weather", "animal"
        recommendation: String,
        recommendationArabic: String,
        priority: String,
        potentialImpact: String, // "Save 5000 EGP"
      },
    ],

    // ============ RISK ASSESSMENT ============
    riskAssessment: {
      overallRiskScore: { type: Number, default: 0 }, // 0-100
      riskLevel: { type: String, enum: ["low", "medium", "high", "critical"] },
      risks: [
        {
          type: String,
          description: String,
          descriptionArabic: String,
          probability: Number,
          impact: Number,
          mitigation: String,
        },
      ],
    },

    // Legacy fields for backward compatibility
    cropPriceTrends: mongoose.Schema.Types.Mixed,
    waterUsageTrends: mongoose.Schema.Types.Mixed,
    fertilizerRecommendations: mongoose.Schema.Types.Mixed,
    currencyImpact: mongoose.Schema.Types.Mixed,
    oilImpact: mongoose.Schema.Types.Mixed,
    newsImpact: mongoose.Schema.Types.Mixed,
    weatherImpact: mongoose.Schema.Types.Mixed,
    riskScore: Number,
  },
  { timestamps: true }
);

// Indexes
dashboardStatsSchema.index({ user: 1, date: -1 });
dashboardStatsSchema.index({ farm: 1, date: -1 });
dashboardStatsSchema.index({ isGlobal: 1, date: -1 });

export default mongoose.model("DashboardStats", dashboardStatsSchema);
