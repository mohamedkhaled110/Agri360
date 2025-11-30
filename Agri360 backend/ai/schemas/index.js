/**
 * Agri360 - Zod Validation Schemas
 * Defines all input/output schemas for the AI agent system
 */

import { z } from "zod";

// ========================================
// LOCATION SCHEMAS
// ========================================

export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90).describe("Latitude"),
  lon: z.number().min(-180).max(180).describe("Longitude"),
  address: z.string().optional().describe("Human-readable address"),
  governorate: z.string().optional().describe("Egyptian governorate (محافظة)"),
  city: z.string().optional().describe("City or village name"),
});

// Egypt governorates with their typical soil data defaults
export const EgyptGovernorateDefaults = {
  kafr_el_sheikh: { soilPh: 7.8, soilType: "clay", avgRainfall: 50 },
  dakahlia: { soilPh: 7.5, soilType: "alluvial", avgRainfall: 40 },
  sharqia: { soilPh: 7.6, soilType: "sandy_loam", avgRainfall: 30 },
  beheira: { soilPh: 7.9, soilType: "clay_loam", avgRainfall: 45 },
  gharbia: { soilPh: 7.7, soilType: "clay", avgRainfall: 35 },
  menoufia: { soilPh: 7.4, soilType: "alluvial", avgRainfall: 25 },
  qalyubia: { soilPh: 7.3, soilType: "sandy_loam", avgRainfall: 20 },
  giza: { soilPh: 7.5, soilType: "sandy", avgRainfall: 15 },
  fayoum: { soilPh: 7.8, soilType: "clay_loam", avgRainfall: 10 },
  beni_suef: { soilPh: 7.6, soilType: "alluvial", avgRainfall: 5 },
  minya: { soilPh: 7.7, soilType: "clay", avgRainfall: 5 },
  assiut: { soilPh: 7.8, soilType: "sandy_loam", avgRainfall: 3 },
  sohag: { soilPh: 7.9, soilType: "clay", avgRainfall: 2 },
  qena: { soilPh: 8.0, soilType: "sandy", avgRainfall: 1 },
  luxor: { soilPh: 8.1, soilType: "sandy_loam", avgRainfall: 1 },
  aswan: { soilPh: 8.2, soilType: "sandy", avgRainfall: 0 },
  new_valley: { soilPh: 8.0, soilType: "sandy", avgRainfall: 0 },
  red_sea: { soilPh: 8.5, soilType: "sandy", avgRainfall: 5 },
  north_sinai: { soilPh: 7.8, soilType: "sandy", avgRainfall: 100 },
  south_sinai: { soilPh: 8.0, soilType: "sandy", avgRainfall: 30 },
  matrouh: { soilPh: 7.9, soilType: "sandy_loam", avgRainfall: 150 },
  ismailia: { soilPh: 7.6, soilType: "sandy_loam", avgRainfall: 25 },
  suez: { soilPh: 7.8, soilType: "sandy", avgRainfall: 15 },
  port_said: { soilPh: 7.5, soilType: "sandy_loam", avgRainfall: 75 },
  damietta: { soilPh: 7.4, soilType: "alluvial", avgRainfall: 60 },
  alexandria: { soilPh: 7.6, soilType: "sandy_loam", avgRainfall: 180 },
  cairo: { soilPh: 7.5, soilType: "sandy", avgRainfall: 25 },
};

// ========================================
// SOIL SCHEMAS
// ========================================

export const SoilSchema = z.object({
  ph: z.number().min(0).max(14).optional().describe("Soil pH level (0-14)"),
  nitrogen: z.number().min(0).optional().describe("Nitrogen content (ppm)"),
  phosphorus: z.number().min(0).optional().describe("Phosphorus content (ppm)"),
  potassium: z.number().min(0).optional().describe("Potassium content (ppm)"),
  organicMatter: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Organic matter percentage"),
  soilType: z
    .enum([
      "clay",
      "sandy",
      "loam",
      "clay_loam",
      "sandy_loam",
      "alluvial",
      "silt",
    ])
    .optional(),
  salinity: z.number().min(0).optional().describe("Soil salinity (dS/m)"),
});

// ========================================
// WATER SCHEMAS
// ========================================

export const WaterSchema = z.object({
  availableM3PerMonth: z
    .number()
    .min(0)
    .optional()
    .describe("Available water (cubic meters per month)"),
  source: z.enum(["nile", "well", "canal", "rain", "mixed"]).optional(),
  irrigationType: z
    .enum(["flood", "drip", "sprinkler", "pivot", "furrow"])
    .optional(),
  waterQuality: z.enum(["fresh", "brackish", "saline", "treated"]).optional(),
});

// ========================================
// FARM SCHEMAS
// ========================================

export const FarmSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  owner: z.string().optional(),
  location: LocationSchema.optional(),
  fieldSizeHectares: z.number().min(0).describe("Farm size in hectares"),
  fieldSizeFeddans: z
    .number()
    .min(0)
    .optional()
    .describe("Farm size in feddans (Egyptian unit)"),
  soil: SoilSchema.optional(),
  water: WaterSchema.optional(),
  cropHistory: z
    .array(
      z.object({
        crop: z.string(),
        year: z.number(),
        yield: z.number().optional(),
        issues: z.array(z.string()).optional(),
      })
    )
    .optional(),
  currentCrops: z.array(z.string()).optional(),
  animals: z
    .array(
      z.object({
        type: z.string(),
        count: z.number(),
        purpose: z.enum(["dairy", "meat", "eggs", "wool", "mixed"]).optional(),
      })
    )
    .optional(),
  constraints: z
    .array(z.string())
    .optional()
    .describe("Farm constraints (e.g., labor shortage, equipment limitations)"),
});

// ========================================
// CROP PLAN SCHEMAS
// ========================================

export const CropPlanInputSchema = z.object({
  farm: FarmSchema,
  targetCrops: z
    .array(z.string())
    .optional()
    .describe("Specific crops farmer wants to consider"),
  seasonStart: z.string().optional().describe("Season start date (YYYY-MM-DD)"),
  seasonEnd: z.string().optional().describe("Season end date (YYYY-MM-DD)"),
  budget: z.number().optional().describe("Available budget in EGP"),
  prioritize: z
    .enum(["profit", "yield", "water_efficiency", "low_risk", "sustainability"])
    .optional(),
  lang: z.enum(["en", "ar"]).default("en"),
});

export const FertilizerRecommendationSchema = z.object({
  stage: z.string(),
  product: z.string(),
  rateKgPerHectare: z.number(),
  timingDaysAfterPlanting: z.number(),
  estimatedCostEGP: z.number().optional(),
});

export const IrrigationPlanSchema = z.object({
  totalM3PerHectare: z.number(),
  monthlyUsageM3: z.record(z.string(), z.number()),
  schedule: z.string(),
  expectedDeficitM3PerHectare: z.number().optional(),
  recommendations: z.array(z.string()).optional(),
});

export const CropRecommendationSchema = z.object({
  crop: z.string(),
  cropArabic: z.string().optional(),
  recommendationScore: z.number().min(0).max(100),
  plantingWindow: z.object({
    start: z.string(),
    end: z.string(),
  }),
  fertilizerPlan: z.array(FertilizerRecommendationSchema),
  irrigationPlan: IrrigationPlanSchema,
  expectedYieldTonnesPerHectare: z.number(),
  expectedYieldConfidence: z.enum(["low", "medium", "high"]),
  estimatedCosts: z.object({
    seeds: z.number(),
    fertilizer: z.number(),
    irrigation: z.number(),
    labor: z.number(),
    pesticides: z.number().optional(),
    total: z.number(),
    currency: z.string().default("EGP"),
  }),
  estimatedRevenue: z.number(),
  profitMargin: z.number(),
  risks: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const CropPlanOutputSchema = z.object({
  recommendations: z.array(CropRecommendationSchema),
  selectedOptimalCrop: z.string(),
  summary: z.string(),
  summaryArabic: z.string().optional(),
  marketAnalysis: z
    .object({
      currentPrices: z.record(z.string(), z.number()).optional(),
      priceTrend: z.record(z.string(), z.string()).optional(),
      demandLevel: z
        .record(z.string(), z.enum(["low", "medium", "high"]))
        .optional(),
      supplyGaps: z.array(z.string()).optional(),
    })
    .optional(),
  weatherOutlook: z
    .object({
      summary: z.string(),
      risks: z.array(z.string()),
    })
    .optional(),
  notes: z.string(),
  dataSourcesUsed: z.array(z.string()),
  generatedAt: z.string(),
});

// ========================================
// BUSINESS PLAN SCHEMAS
// ========================================

export const BusinessPlanInputSchema = z.object({
  farm: FarmSchema,
  crop: z.string().optional(),
  crops: z.array(z.string()).optional(),
  planDurationMonths: z.number().min(1).max(60).default(12),
  initialInvestment: z.number().optional(),
  targetProfit: z.number().optional(),
  includeAnimals: z.boolean().default(false),
  animals: z
    .array(
      z.object({
        type: z.string(),
        count: z.number(),
        purpose: z.string().optional(),
      })
    )
    .optional(),
  marketStrategy: z.enum(["local", "wholesale", "export", "mixed"]).optional(),
  lang: z.enum(["en", "ar"]).default("en"),
});

export const TaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameArabic: z.string().optional(),
  description: z.string(),
  category: z.enum([
    "preparation",
    "planting",
    "irrigation",
    "fertilization",
    "pest_control",
    "harvest",
    "marketing",
    "maintenance",
    "animal_care",
  ]),
  startDate: z.string(),
  endDate: z.string(),
  durationDays: z.number(),
  dependencies: z.array(z.string()),
  estimatedCost: z.number().optional(),
  resources: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z
    .enum(["pending", "in_progress", "completed", "delayed"])
    .default("pending"),
});

export const MonthlyFinancialSchema = z.object({
  month: z.string(),
  expenses: z.object({
    seeds: z.number().default(0),
    fertilizer: z.number().default(0),
    pesticides: z.number().default(0),
    labor: z.number().default(0),
    irrigation: z.number().default(0),
    fuel: z.number().default(0),
    equipment: z.number().default(0),
    animalFeed: z.number().default(0),
    veterinary: z.number().default(0),
    other: z.number().default(0),
    total: z.number(),
  }),
  revenue: z.object({
    cropSales: z.number().default(0),
    animalProducts: z.number().default(0),
    other: z.number().default(0),
    total: z.number(),
  }),
  netCashFlow: z.number(),
  cumulativeCashFlow: z.number(),
});

export const BusinessPlanOutputSchema = z.object({
  summary: z.string(),
  summaryArabic: z.string().optional(),

  // Timeline with tasks
  timeline: z.object({
    startDate: z.string(),
    endDate: z.string(),
    totalDurationMonths: z.number(),
    phases: z.array(
      z.object({
        name: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        tasks: z.array(TaskSchema),
      })
    ),
    milestones: z.array(
      z.object({
        name: z.string(),
        date: z.string(),
        description: z.string(),
      })
    ),
  }),

  // Financial projections
  financials: z.object({
    totalInvestment: z.number(),
    totalExpenses: z.number(),
    totalRevenue: z.number(),
    netProfit: z.number(),
    profitMargin: z.number(),
    roi: z.number(),
    paybackPeriodMonths: z.number(),
    breakEvenDate: z.string().optional(),
    monthlyProjections: z.array(MonthlyFinancialSchema),
    costBreakdown: z.record(z.string(), z.number()),
    revenueBreakdown: z.record(z.string(), z.number()),
    sensitivity: z.object({
      bestCase: z.object({ profit: z.number(), roi: z.number() }),
      worstCase: z.object({ profit: z.number(), roi: z.number() }),
      mainRiskFactors: z.array(z.string()),
    }),
    currency: z.string().default("EGP"),
  }),

  // Market analysis
  marketAnalysis: z.object({
    currentMarketConditions: z.string(),
    priceForecasts: z.record(
      z.string(),
      z.object({
        current: z.number(),
        forecast3Months: z.number(),
        forecast6Months: z.number(),
        trend: z.enum(["up", "down", "stable"]),
      })
    ),
    competitionLevel: z.enum(["low", "medium", "high"]),
    demandOutlook: z.string(),
    bestSellingPeriods: z.array(
      z.object({
        crop: z.string(),
        months: z.array(z.string()),
        reason: z.string(),
      })
    ),
    exportOpportunities: z.array(z.string()).optional(),
  }),

  // External factors
  externalFactors: z.object({
    usdToEgp: z.number(),
    usdTrend: z.enum(["appreciating", "depreciating", "stable"]),
    oilPriceUsd: z.number().optional(),
    inflationImpact: z.string(),
    governmentPolicies: z.array(z.string()).optional(),
    weatherRisks: z.array(z.string()),
    globalMarketNews: z
      .array(
        z.object({
          headline: z.string(),
          impact: z.string(),
          source: z.string().optional(),
        })
      )
      .optional(),
  }),

  // Recommendations
  recommendations: z.object({
    immediate: z.array(z.string()),
    shortTerm: z.array(z.string()),
    longTerm: z.array(z.string()),
    riskMitigation: z.array(z.string()),
  }),

  // Animal management (if applicable)
  animalPlan: z
    .object({
      feedingSchedule: z.array(
        z.object({
          animal: z.string(),
          feedType: z.string(),
          dailyAmount: z.string(),
          monthlyCost: z.number(),
        })
      ),
      breedingSchedule: z.array(
        z.object({
          animal: z.string(),
          event: z.string(),
          date: z.string(),
        })
      ),
      sellingSchedule: z.array(
        z.object({
          animal: z.string(),
          quantity: z.number(),
          expectedDate: z.string(),
          expectedPrice: z.number(),
        })
      ),
      healthPlan: z.array(
        z.object({
          animal: z.string(),
          vaccination: z.string(),
          date: z.string(),
        })
      ),
    })
    .optional(),

  // Metadata
  confidence: z.enum(["low", "medium", "high"]),
  assumptions: z.array(z.string()),
  dataSourcesUsed: z.array(z.string()),
  generatedAt: z.string(),
  notes: z.string(),
});

// ========================================
// CHAT SCHEMAS
// ========================================

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.string().optional(),
});

export const ChatInputSchema = z.object({
  message: z.string().min(1),
  mode: z.enum(["chat", "plan", "analysis"]).default("chat"),
  conversationHistory: z.array(ChatMessageSchema).optional(),
  farmContext: FarmSchema.optional(),
  lang: z
    .string()
    .default("en")
    .transform((val) => {
      // Accept any language input but normalize to 'en' or 'ar'
      if (val === "ar" || val?.startsWith?.("ar")) return "ar";
      return "en";
    }),
});

export const ChatOutputSchema = z.object({
  reply: z.string(),
  replyArabic: z.string().optional(),
  suggestedActions: z
    .array(
      z.object({
        action: z.string(),
        description: z.string(),
        endpoint: z.string().optional(),
      })
    )
    .optional(),
  relatedData: z.any().optional(),
});

// ========================================
// API RESPONSE SCHEMAS
// ========================================

export const WeatherDataSchema = z.object({
  current: z
    .object({
      temperature: z.number(),
      humidity: z.number(),
      windSpeed: z.number().optional(),
      precipitation: z.number().optional(),
      condition: z.string().optional(),
    })
    .optional(),
  forecast: z
    .array(
      z.object({
        date: z.string(),
        tempMax: z.number(),
        tempMin: z.number(),
        precipitation: z.number(),
        humidity: z.number().optional(),
      })
    )
    .optional(),
  location: z
    .object({
      name: z.string(),
      country: z.string(),
    })
    .optional(),
});

export const MarketPriceSchema = z.object({
  crop: z.string(),
  price: z.number(),
  unit: z.string(),
  currency: z.string().default("EGP"),
  source: z.string(),
  date: z.string(),
  trend: z.enum(["up", "down", "stable"]).optional(),
});

export const ForexRateSchema = z.object({
  base: z.string(),
  target: z.string(),
  rate: z.number(),
  timestamp: z.string(),
});

export const OilPriceSchema = z.object({
  brent: z.number().optional(),
  wti: z.number().optional(),
  currency: z.string().default("USD"),
  timestamp: z.string(),
});

export const NewsItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
  publishedAt: z.string().optional(),
  sentiment: z.enum(["positive", "negative", "neutral"]).optional(),
  relevance: z.number().optional(),
});

// ========================================
// AGENT STATE SCHEMA
// ========================================

export const AgentStateSchema = z.object({
  // Input data
  input: z.any(),
  inputType: z.enum(["crop_plan", "business_plan", "chat", "analysis"]),

  // Farm data
  farm: FarmSchema.optional(),

  // Gathered external data
  weatherData: WeatherDataSchema.optional(),
  marketPrices: z.array(MarketPriceSchema).optional(),
  forexRate: ForexRateSchema.optional(),
  oilPrice: OilPriceSchema.optional(),
  newsItems: z.array(NewsItemSchema).optional(),
  faoData: z.any().optional(),

  // Analysis results (from DeepSeek)
  analysis: z
    .object({
      marketAnalysis: z.string().optional(),
      weatherAnalysis: z.string().optional(),
      soilAnalysis: z.string().optional(),
      riskAnalysis: z.string().optional(),
      financialAnalysis: z.string().optional(),
      recommendations: z.array(z.string()).optional(),
    })
    .optional(),

  // Final plan (from Qwen)
  plan: z.union([CropPlanOutputSchema, BusinessPlanOutputSchema]).optional(),

  // Chat response
  chatResponse: ChatOutputSchema.optional(),

  // Conversation history
  messages: z.array(ChatMessageSchema).default([]),

  // Metadata
  errors: z.array(z.string()).default([]),
  currentStep: z.string(),
  language: z.enum(["en", "ar"]).default("en"),
});

export default {
  LocationSchema,
  SoilSchema,
  WaterSchema,
  FarmSchema,
  CropPlanInputSchema,
  CropPlanOutputSchema,
  BusinessPlanInputSchema,
  BusinessPlanOutputSchema,
  ChatInputSchema,
  ChatOutputSchema,
  AgentStateSchema,
  EgyptGovernorateDefaults,
};
