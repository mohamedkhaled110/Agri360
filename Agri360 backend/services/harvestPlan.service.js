/**
 * Agri360 - Harvest/Crop Plan Service
 * Handles crop planning using AI agent
 */

import HarvestPlan from "../models/HarvestPlan.js";
import Farm from "../models/Farm.js";
import aiService from "../ai/index.js";

/**
 * Create a crop/harvest plan using AI
 */
export const createPlan = async (data, lang = "en") => {
  try {
    console.log("🌱 Creating harvest/crop plan...");

    const { farmer, farmId, farm: farmData, crop, crops } = data;

    // Get farm from database if farmId provided
    let farm = farmData;
    if (farmId && !farm) {
      farm = await Farm.findById(farmId).lean();
    }

    // Prepare context for AI
    const aiContext = {
      farm,
      targetCrops: crops || (crop ? [crop] : undefined),
      seasonStart: data.seasonStart || data.plantingDate,
      seasonEnd: data.seasonEnd || data.harvestDate,
      budget: data.budget,
      prioritize: data.prioritize || "profit",
    };

    // Generate crop plan using AI agent
    console.log("🤖 Calling AI agent for crop planning...");
    const aiResult = await aiService.planCrops(aiContext, lang);

    // Extract the optimal recommendation
    const optimalCrop =
      aiResult.selectedOptimalCrop ||
      aiResult.recommendations?.[0]?.crop ||
      crop;
    const recommendation =
      aiResult.recommendations?.find((r) => r.crop === optimalCrop) ||
      aiResult.recommendations?.[0];

    // Calculate dates from recommendations
    const plantingDate = recommendation?.plantingWindow?.start
      ? new Date(recommendation.plantingWindow.start)
      : data.plantingDate
      ? new Date(data.plantingDate)
      : new Date();

    const harvestDate = recommendation?.plantingWindow?.end
      ? new Date(recommendation.plantingWindow.end)
      : data.harvestDate
      ? new Date(data.harvestDate)
      : new Date(plantingDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days default

    // Save to database
    const plan = await HarvestPlan.create({
      farmer,
      farm: farmId || farm?._id,
      crop: optimalCrop,
      plantingDate,
      harvestDate,
      irrigationSchedule:
        recommendation?.irrigationPlan ||
        aiResult.recommendations?.[0]?.irrigationPlan ||
        {},
      fertilizerSchedule:
        recommendation?.fertilizerPlan ||
        aiResult.recommendations?.[0]?.fertilizerPlan ||
        [],
      expectedYield: recommendation?.expectedYieldTonnesPerHectare,
      aiNotes: {
        // Full AI-generated plan
        fullPlan: aiResult,
        // Key data for frontend
        summary: aiResult.summary,
        summaryArabic: aiResult.summaryArabic,
        recommendations: aiResult.recommendations,
        selectedCrop: optimalCrop,
        marketAnalysis: aiResult.marketAnalysis,
        weatherOutlook: aiResult.weatherOutlook,
        confidence: recommendation?.expectedYieldConfidence,
        estimatedCosts: recommendation?.estimatedCosts,
        estimatedRevenue: recommendation?.estimatedRevenue,
        profitMargin: recommendation?.profitMargin,
        risks: recommendation?.risks,
        dataSourcesUsed: aiResult.dataSourcesUsed,
      },
    });

    console.log("✅ Harvest plan saved to database:", plan._id);
    return plan;
  } catch (err) {
    console.error("❌ createPlan error:", err.message || err);
    console.error("Stack:", err.stack);
    throw err;
  }
};

/**
 * Get all harvest plans with optional filter
 */
export const listPlans = async (filter = {}) => {
  return await HarvestPlan.find(filter)
    .populate("farm", "name location fieldSizeHectares")
    .populate("farmer", "name email")
    .sort({ createdAt: -1 });
};

/**
 * Get a single harvest plan by ID
 */
export const getPlanById = async (id) => {
  return await HarvestPlan.findById(id)
    .populate("farm", "name location fieldSizeHectares soil water")
    .populate("farmer", "name email");
};

/**
 * Update a harvest plan
 */
export const updatePlan = async (id, updates) => {
  return await HarvestPlan.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
};

/**
 * Delete a harvest plan
 */
export const deletePlan = async (id) => {
  return await HarvestPlan.findByIdAndDelete(id);
};

/**
 * Get upcoming tasks from harvest plans
 */
export const getUpcomingTasks = async (farmerId, days = 30) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const plans = await HarvestPlan.find({
    farmer: farmerId,
    $or: [
      { plantingDate: { $gte: now, $lte: futureDate } },
      { harvestDate: { $gte: now, $lte: futureDate } },
    ],
  }).populate("farm", "name");

  const tasks = [];
  for (const plan of plans) {
    if (plan.plantingDate >= now && plan.plantingDate <= futureDate) {
      tasks.push({
        type: "planting",
        date: plan.plantingDate,
        crop: plan.crop,
        farm: plan.farm?.name,
        planId: plan._id,
      });
    }
    if (plan.harvestDate >= now && plan.harvestDate <= futureDate) {
      tasks.push({
        type: "harvest",
        date: plan.harvestDate,
        crop: plan.crop,
        farm: plan.farm?.name,
        planId: plan._id,
      });
    }
  }

  return tasks.sort((a, b) => a.date - b.date);
};

export default {
  createPlan,
  listPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getUpcomingTasks,
};
