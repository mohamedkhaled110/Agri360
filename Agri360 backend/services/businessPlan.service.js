/**
 * Agri360 - Business Plan Service
 * Handles business plan generation using AI agent
 */

import BusinessPlan from "../models/BusinessPlan.js";
import Farm from "../models/Farm.js";
import aiService from "../ai/index.js";

/**
 * Create a comprehensive business plan using AI
 */
export const createBusinessPlan = async (data, lang = "en") => {
  try {
    console.log("📋 Creating business plan...");

    const { farmer, farmId, farm: farmData, crop, crops } = data;

    // Get farm from database if farmId provided
    let farm = farmData;
    if (farmId && !farm) {
      farm = await Farm.findById(farmId).lean();
      if (!farm) {
        console.warn("Farm not found for ID:", farmId);
      }
    }

    // Prepare context for AI
    const aiContext = {
      farm,
      crop: crop || crops?.[0],
      crops,
      planDurationMonths: data.planDurationMonths || 12,
      initialInvestment: data.initialInvestment || data.budget,
      targetProfit: data.targetProfit,
      includeAnimals: data.includeAnimals || Boolean(data.animals?.length),
      animals: data.animals,
      marketStrategy: data.marketStrategy || "local",
    };

    // Generate business plan using AI agent
    console.log("🤖 Calling AI agent for business plan...");
    const aiResult = await aiService.generateBusinessPlan(aiContext, lang);

    // Extract key metrics from AI result
    const financials = aiResult.financials || {};
    const timeline = aiResult.timeline || {};

    // Save to database
    const plan = await BusinessPlan.create({
      farmer,
      farm: farmId || farm?._id,
      crop: crop || crops?.[0] || "multiple",
      investmentCost: financials.totalInvestment || data.initialInvestment,
      expectedRevenue: financials.totalRevenue,
      profitMargin: financials.profitMargin,
      aiAdvice: {
        // Full AI-generated plan
        fullPlan: aiResult,
        // Structured data for frontend
        summary: aiResult.summary,
        summaryArabic: aiResult.summaryArabic,
        timeline: timeline,
        financials: financials,
        marketAnalysis: aiResult.marketAnalysis,
        externalFactors: aiResult.externalFactors,
        recommendations: aiResult.recommendations,
        animalPlan: aiResult.animalPlan,
        confidence: aiResult.confidence,
        assumptions: aiResult.assumptions,
        risks: financials.sensitivity?.mainRiskFactors,
      },
      timeline: {
        startDate: timeline.startDate,
        endDate: timeline.endDate,
        milestones: timeline.milestones,
        phases: timeline.phases?.map((p) => ({
          name: p.name,
          startDate: p.startDate,
          endDate: p.endDate,
          taskCount: p.tasks?.length || 0,
        })),
      },
    });

    console.log("✅ Business plan saved to database:", plan._id);
    return plan;
  } catch (err) {
    console.error("❌ createBusinessPlan error:", err.message || err);
    console.error("Stack:", err.stack);
    throw err;
  }
};

/**
 * Get all business plans with optional filter
 */
export const getBusinessPlans = async (filter = {}) => {
  const plans = await BusinessPlan.find(filter)
    .populate("farmer", "name email")
    .populate("farm", "name location fieldSizeHectares")
    .sort({ createdAt: -1 });
  return plans;
};

/**
 * Get a single business plan by ID
 */
export const getBusinessPlanById = async (id) => {
  return await BusinessPlan.findById(id)
    .populate("farmer", "name email")
    .populate("farm", "name location fieldSizeHectares soil water");
};

/**
 * Update a business plan
 */
export const updateBusinessPlan = async (id, updates) => {
  return await BusinessPlan.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
};

/**
 * Delete a business plan
 */
export const deleteBusinessPlan = async (id) => {
  return await BusinessPlan.findByIdAndDelete(id);
};

/**
 * Get business plan summary/statistics
 */
export const getBusinessPlanStats = async (farmerId) => {
  const plans = await BusinessPlan.find({ farmer: farmerId });

  if (plans.length === 0) {
    return {
      totalPlans: 0,
      totalInvestment: 0,
      totalExpectedRevenue: 0,
      avgProfitMargin: 0,
    };
  }

  const totalInvestment = plans.reduce(
    (sum, p) => sum + (p.investmentCost || 0),
    0
  );
  const totalExpectedRevenue = plans.reduce(
    (sum, p) => sum + (p.expectedRevenue || 0),
    0
  );
  const avgProfitMargin =
    plans.reduce((sum, p) => sum + (p.profitMargin || 0), 0) / plans.length;

  return {
    totalPlans: plans.length,
    totalInvestment,
    totalExpectedRevenue,
    avgProfitMargin: Math.round(avgProfitMargin * 100) / 100,
  };
};

export default {
  createBusinessPlan,
  getBusinessPlans,
  getBusinessPlanById,
  updateBusinessPlan,
  deleteBusinessPlan,
  getBusinessPlanStats,
};
