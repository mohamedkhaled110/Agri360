/**
 * Simplified Business Plan Generation - for debugging
 * This version calls ONLY the AI service, skipping all data aggregation
 * Use this to verify the AI service works independently
 */

import aiService from "../services/aiService.js";
import { t } from "../utils/translator.js";

export const createSimplePlan = async (req, res) => {
  try {
    const { crop = "wheat", lang = "en" } = req.body;

    console.log("📋 Simple business plan request:", { crop, lang });

    // Minimal context for AI
    const simpleContext = {
      crop,
      task: "Create a simple business plan for " + crop,
    };

    console.log("🤖 Calling AI service with context:", simpleContext);

    // Call AI directly (no data aggregation)
    const aiResult = await aiService.generateBusinessPlan(simpleContext, lang);

    console.log("✅ AI response received (length:", aiResult?.length, ")");

    res.json({
      reply: aiResult,
      message: "Simple business plan generated",
      note: "This is a simplified response from AI service only, without data aggregation",
    });
  } catch (err) {
    console.error("❌ Error in simple business plan:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({
      message: t(req.lang || "en", "server_error"),
      error: err.message,
    });
  }
};

export default { createSimplePlan };
