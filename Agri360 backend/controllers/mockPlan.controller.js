/**
 * Workaround: Create a Simple Business Plan WITHOUT AI
 * This endpoint works without needing the external AI API
 * Perfect for testing while we fix the AI key issue
 */

import BusinessPlan from "../models/BusinessPlan.js";
import { t } from "../utils/translator.js";

export const createSimpleBusinessPlan = async (req, res) => {
  try {
    console.log("📋 Simple Business Plan (No AI) Request");
    const data = req.body;
    const lang = req.lang || req.body.lang || "en";

    // Add farmer ID from authenticated user
    data.farmer = req.user?.id || req.user?._id;

    console.log("Creating simple plan without AI...");

    // Create a business plan WITHOUT calling external AI
    const plan = await BusinessPlan.create({
      farmer: data.farmer,
      farm: data.farmId || data.farm?._id || null,
      crop: data.crop || "wheat",
      investmentCost: 5000, // Mock data
      expectedRevenue: 15000, // Mock data
      aiAdvice: {
        businessPlan:
          lang === "ar" || lang === "ar-EG" || lang === "ar-SA"
            ? "خطة عمل شاملة للمحاصيل الزراعية مع توصيات بشأن التكاليف والإيرادات المتوقعة والفترة الزمنية المقترحة للزراعة والحصاد والتسويق."
            : "Comprehensive agricultural business plan with recommendations on costs, expected revenues, and proposed timeline for planting, harvesting, and marketing.",
        costEstimate: {
          total: 5000,
          seeds: 1000,
          labor: 2000,
          fertilizer: 1500,
          other: 500,
        },
        fertilizer: { urea: 100, phosphate: 50, potassium: 30 },
        waterPlan: { estimatedM3: 4500, frequency: "weekly", season: "growth" },
        priceForecast: { trend: "stable", confidence: 0.7 },
        profitEstimate: {
          revenue: 15000,
          expenses: 5000,
          netProfit: 10000,
          margin: 66.67,
        },
      },
      profitMargin: 66.67,
      timeline: {
        month1: "Preparation and soil analysis",
        month2: "Planting",
        month3: "Growth and maintenance",
        month4: "Harvesting",
        month5: "Marketing and sales",
      },
    });

    console.log("✅ Simple business plan created");

    res.status(201).json({
      businessPlan: plan,
      message:
        lang === "ar" || lang === "ar-EG" || lang === "ar-SA"
          ? "تم إنشاء خطة عمل بسيطة بنجاح"
          : "Simple business plan created successfully",
      note: "This is a mock business plan (AI service is testing)",
    });
  } catch (err) {
    console.error("❌ Error creating simple plan:", err.message);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export default { createSimpleBusinessPlan };
