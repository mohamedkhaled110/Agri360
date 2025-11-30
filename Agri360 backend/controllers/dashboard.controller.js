import DashboardStats from "../models/DashboardStats.js";
import HarvestPlan from "../models/HarvestPlan.js";
import BusinessPlan from "../models/BusinessPlan.js";
import Farm from "../models/Farm.js";
import priceService from "../services/priceService.js";
import forexService from "../services/forexService.js";
import newsService from "../services/newsService.js";
import weatherService from "../services/weatherService.js";
import faoService from "../services/faoService.js";
import oilService from "../services/oilService.js";
import { t } from "../utils/translator.js";

// ========== GET DASHBOARD ==========

export const getStats = async (req, res) => {
  try {
    const userId = req.user?._id;
    const farmId = req.user?.farm;

    // Get user-specific dashboard or latest general stats
    let stats;
    if (userId) {
      stats = await DashboardStats.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .lean();
    }
    if (!stats) {
      stats = await DashboardStats.findOne().sort({ createdAt: -1 }).lean();
    }

    // Fetch current Mahsoly crop prices
    const mahsolyPrices = await priceService.getStockMarketPrices();

    // Get active plans summary
    let plansSummary = null;
    if (userId) {
      const [harvestPlans, businessPlans] = await Promise.all([
        HarvestPlan.find({
          $or: [{ user: userId }, { farm: farmId }],
          status: "active",
        })
          .select("crop status plantingDate harvestDate estimatedYield")
          .lean(),
        BusinessPlan.find({
          $or: [{ user: userId }, { farm: farmId }],
          status: "active",
        })
          .select("title status budget")
          .lean(),
      ]);

      plansSummary = {
        activeHarvestPlans: harvestPlans,
        activeBusinessPlans: businessPlans,
        totalActivePlans: harvestPlans.length + businessPlans.length,
      };
    }

    const enrichedStats = {
      ...stats,
      cropPrices: mahsolyPrices.prices || [],
      pricesSource: mahsolyPrices.source,
      pricesLastUpdated: mahsolyPrices.lastUpdated,
      plansSummary,
    };

    res.json({ stats: enrichedStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== COMPUTE & STORE ==========

export const computeAndStore = async (req, res) => {
  try {
    const userId = req.user?._id;
    const farmId = req.user?.farm;
    const { crop = "wheat", cropCode = faoService.FAO_ITEMS.WHEAT } = req.body;

    // Get farm data
    let farm = null;
    if (farmId) {
      farm = await Farm.findById(farmId);
    }

    // Fetch all data sources for AI analysis
    const [mahsolyData, fx, news, weather, faoData, oil] = await Promise.all([
      priceService.aggregateMahsolyData(crop),
      forexService.fetchExchangeRate(),
      newsService.getNewsSentiment(crop),
      farm ? weatherService.getForecastForFarm(farm) : Promise.resolve(null),
      faoService.aggregateAgriculturalData(cropCode),
      oilService.fetchOilPrice(),
    ]);

    // Get active plans for user
    let activePlans = { cropPlans: 0, businessPlans: 0, totalValue: 0 };
    let planSummaries = [];
    if (userId) {
      const [harvestPlans, businessPlans] = await Promise.all([
        HarvestPlan.find({
          $or: [{ user: userId }, { farm: farmId }],
          status: "active",
        }).lean(),
        BusinessPlan.find({
          $or: [{ user: userId }, { farm: farmId }],
          status: "active",
        }).lean(),
      ]);

      activePlans = {
        cropPlans: harvestPlans.length,
        businessPlans: businessPlans.length,
        totalValue: harvestPlans.reduce(
          (sum, p) => sum + (p.estimatedRevenue || 0),
          0
        ),
      };

      planSummaries = [
        ...harvestPlans.map((p) => ({
          planType: "harvest",
          planId: p._id,
          title: p.crop,
          status: p.status,
          progress: calculatePlanProgress(p),
          nextAction: getNextAction(p),
        })),
        ...businessPlans.map((p) => ({
          planType: "business",
          planId: p._id,
          title: p.title,
          status: p.status,
          progress: p.progress || 0,
          nextAction: "Review plan milestones",
        })),
      ];
    }

    // Calculate risk factors
    const riskFactors = [];
    const newsScore = (news?.score || 0) * -1;

    if (newsScore > 5)
      riskFactors.push({
        factor: "market_sentiment",
        level: "medium",
        description: "Negative market news sentiment",
      });
    if (weather?.alerts?.length > 0)
      riskFactors.push({
        factor: "weather",
        level: "high",
        description: `${weather.alerts.length} weather alerts active`,
      });
    if (oil?.brent > 100)
      riskFactors.push({
        factor: "fuel_costs",
        level: "medium",
        description: "High oil prices affecting transport costs",
      });

    // Overall risk score
    const riskScore = Math.max(
      0,
      Math.min(
        100,
        Math.abs(newsScore) * 2 +
          (weather?.alerts?.length || 0) * 15 +
          (oil?.brent > 100 ? 10 : 0)
      )
    );

    // Market analysis
    const marketAnalysis = {
      topCrops: mahsolyData?.prices?.slice(0, 5) || [],
      priceChanges: mahsolyData?.trends || [],
      tradingVolume: mahsolyData?.volume || 0,
    };

    // Weather analysis
    const weatherAnalysis = weather
      ? {
          current: weather.current,
          forecast7Day: weather.forecast?.slice(0, 7),
          alerts: weather.alerts || [],
          suitability: assessWeatherSuitability(weather, crop),
        }
      : null;

    // Financial analysis
    const financialAnalysis = {
      exchangeRate: fx,
      oilPrice: oil,
      inputCostTrend: calculateInputCostTrend(oil, fx),
    };

    // Generate alerts
    const alerts = generateAlerts(
      news,
      weather,
      mahsolyData,
      oil,
      req.lang || "en"
    );

    const stats = await DashboardStats.create({
      user: userId,
      farm: farmId,
      period: {
        start: new Date(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days ahead
      },
      activePlans,
      planSummaries,
      cropPriceTrends: mahsolyData,
      currencyImpact: fx,
      newsImpact: news,
      weatherImpact: weather,
      oilImpact: oil,
      faoDataForAI: faoData,
      marketAnalysis,
      weatherAnalysis,
      financialAnalysis,
      riskAnalysis: {
        overallScore: riskScore,
        factors: riskFactors,
        alerts,
      },
      riskScore,
      alerts,
    });

    res.json({ stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== GET USER DASHBOARD ==========

export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const farmId = req.user.farm;

    // Get latest stats for user
    const stats = await DashboardStats.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Get farm data
    const farm = farmId ? await Farm.findById(farmId).lean() : null;

    // Get active plans
    const [harvestPlans, businessPlans] = await Promise.all([
      HarvestPlan.find({
        $or: [{ user: userId }, { farm: farmId }],
        status: "active",
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      BusinessPlan.find({
        $or: [{ user: userId }, { farm: farmId }],
        status: "active",
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Get current market prices
    const marketPrices = await priceService.getStockMarketPrices();

    // Get weather for farm
    let weather = null;
    if (farm?.location?.lat && farm?.location?.lon) {
      weather = await weatherService.getForecastForFarm(farm);
    }

    // Safely extract prices array
    const pricesArray = Array.isArray(marketPrices?.prices)
      ? marketPrices.prices
      : Array.isArray(marketPrices)
      ? marketPrices
      : [];

    res.json({
      dashboard: {
        stats,
        farm: farm
          ? {
              name: farm.name,
              location: farm.location,
              fieldSizeHectares: farm.fieldSizeHectares,
              hasAnimals: farm.animals?.length > 0,
              animalCount: farm.animals?.length || 0,
            }
          : null,
        plans: {
          harvest: harvestPlans,
          business: businessPlans,
          totalActive: harvestPlans.length + businessPlans.length,
        },
        market: {
          prices: pricesArray.slice(0, 10),
          source: marketPrices?.source || "mahsoly",
          lastUpdated: marketPrices?.lastUpdated || new Date(),
        },
        weather,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== REFRESH DATA ==========

export const refreshDashboard = async (req, res) => {
  try {
    // Call computeAndStore internally
    req.body = req.body || {};
    return computeAndStore(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== HELPER FUNCTIONS ==========

function generateAlerts(news, weather, prices, oil, lang = "en") {
  const alerts = [];

  if (news?.score < -5) alerts.push(t(lang, "alert_negative_market"));
  if (weather?.current?.humidity > 90)
    alerts.push(t(lang, "alert_high_humidity"));
  if (oil?.brent > 100) alerts.push(t(lang, "alert_oil_spike"));
  if (weather?.alerts?.length > 0) {
    weather.alerts.forEach((alert) => {
      alerts.push(alert.description || alert.event || "Weather alert");
    });
  }

  return alerts;
}

function calculatePlanProgress(plan) {
  if (!plan.plantingDate || !plan.harvestDate) return 0;

  const now = new Date();
  const start = new Date(plan.plantingDate);
  const end = new Date(plan.harvestDate);

  if (now < start) return 0;
  if (now > end) return 100;

  const totalDays = (end - start) / (1000 * 60 * 60 * 24);
  const daysPassed = (now - start) / (1000 * 60 * 60 * 24);

  return Math.round((daysPassed / totalDays) * 100);
}

function getNextAction(plan) {
  const progress = calculatePlanProgress(plan);

  if (progress < 10) return "Prepare soil and inputs";
  if (progress < 30) return "Monitor germination and early growth";
  if (progress < 50) return "Apply fertilizers and pest control";
  if (progress < 70) return "Monitor growth and irrigation";
  if (progress < 90) return "Prepare for harvest";
  return "Harvest and post-harvest handling";
}

function assessWeatherSuitability(weather, crop) {
  if (!weather?.current) return "unknown";

  const temp = weather.current.temp;
  const humidity = weather.current.humidity;

  // Simple suitability logic - can be enhanced
  if (temp > 40 || temp < 5) return "poor";
  if (humidity > 90 || humidity < 20) return "moderate";
  return "good";
}

function calculateInputCostTrend(oil, fx) {
  // Simple trend based on oil and forex
  if (oil?.brent > 90 || (fx?.usd && fx.usd > 50)) return "rising";
  if (oil?.brent < 70 && fx?.usd && fx.usd < 40) return "falling";
  return "stable";
}

export default {
  getStats,
  computeAndStore,
  getUserDashboard,
  refreshDashboard,
};
