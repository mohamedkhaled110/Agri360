/**
 * Agri360 - AI Service
 * Main service for AI operations using LangChain/LangGraph agent
 */

import {
  generateCropPlan as agentGenerateCropPlan,
  generateBusinessPlan as agentGenerateBusinessPlan,
  chat as agentChat,
} from "./agent/index.js";
import {
  CropPlanInputSchema,
  BusinessPlanInputSchema,
  ChatInputSchema,
} from "./schemas/index.js";

/**
 * Generate a comprehensive business plan
 * Uses DeepSeek for analysis + Qwen for planning
 */
export const generateBusinessPlan = async (context, lang = "en") => {
  console.log("📊 AI Service: Generating business plan...");

  try {
    // Transform legacy context format to new schema
    const input = transformLegacyBusinessPlanInput(context);

    // Generate plan using multi-agent system
    const plan = await agentGenerateBusinessPlan(input, lang);

    console.log("✅ Business plan generated successfully");
    return plan;
  } catch (error) {
    console.error("❌ Business plan generation error:", error);
    throw error;
  }
};

/**
 * Generate a crop/harvest plan
 * Uses DeepSeek for analysis + Qwen for planning
 */
export const planCrops = async (context, lang = "en") => {
  console.log("🌱 AI Service: Generating crop plan...");

  try {
    // Transform legacy context format to new schema
    const input = transformLegacyCropPlanInput(context);

    // Generate plan using multi-agent system
    const plan = await agentGenerateCropPlan(input, lang);

    console.log("✅ Crop plan generated successfully");
    return plan;
  } catch (error) {
    console.error("❌ Crop plan generation error:", error);
    throw error;
  }
};

/**
 * Chat with the agricultural assistant
 * Uses Qwen for friendly conversation
 * For complex planning requests, uses the full agent system
 * For simple queries, uses direct LLM call for faster response
 */
export const chat = async (message, mode = "chat", lang = "en") => {
  console.log("💬 AI Service: Processing chat...");

  // Normalize language - only accept 'en' or 'ar'
  const normalizedLang =
    lang === "ar" || lang?.startsWith?.("ar") ? "ar" : "en";

  try {
    // Check if this is a complex planning request that needs data gathering
    const isPlanRequest =
      message.toLowerCase().includes("plan") ||
      message.includes("خطة") ||
      mode === "planning" ||
      mode === "business" ||
      mode === "farming";

    if (isPlanRequest) {
      // Use direct LLM for plan generation (faster, more reliable than full agent)
      console.log("📊 Using direct LLM for plan generation...");
      const reply = await directPlanGeneration(message, normalizedLang);
      console.log("✅ Plan generated successfully");
      return reply;
    } else {
      // Use simple direct LLM call for quick responses
      console.log("⚡ Using direct LLM for simple chat...");
      const reply = await directChat(message, normalizedLang);
      console.log("✅ Chat response generated (direct)");
      return reply;
    }
  } catch (error) {
    console.error("❌ Chat error:", error);
    throw error;
  }
};

/**
 * Direct chat without the full agent system
 * Much faster for simple queries
 */
async function directChat(message, lang = "en") {
  const { ChatOpenAI } = await import("@langchain/openai");
  const { HumanMessage, SystemMessage } = await import(
    "@langchain/core/messages"
  );

  const baseUrl =
    process.env.AI_BASE_URL || "https://api-ap-southeast-1.modelarts-maas.com";
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error("AI_API_KEY not set in environment variables");
  }

  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: process.env.AI_MODEL_DEFAULT || "qwen3-32b",
    configuration: {
      baseURL: `${baseUrl}/v1`,
    },
    temperature: 0.7,
    maxTokens: 2048,
  });

  const systemPrompt =
    lang === "ar"
      ? `أنت مساعد زراعي مفيد لمزارعي مصر. أجب بإيجاز ووضوح باللغة العربية.`
      : `You are a helpful agricultural assistant for Egyptian farmers. Answer concisely and clearly.`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(message),
  ]);

  return response.content;
}

/**
 * Direct plan generation without the complex agent system
 * More reliable and faster than the full data-gathering approach
 */
async function directPlanGeneration(message, lang = "en") {
  const { ChatOpenAI } = await import("@langchain/openai");
  const { HumanMessage, SystemMessage } = await import(
    "@langchain/core/messages"
  );

  const baseUrl =
    process.env.AI_BASE_URL || "https://api-ap-southeast-1.modelarts-maas.com";
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error("AI_API_KEY not set in environment variables");
  }

  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: process.env.AI_MODEL_DEFAULT || "qwen3-32b",
    configuration: {
      baseURL: `${baseUrl}/v1`,
    },
    temperature: 0.7,
    maxTokens: 8000, // Allow for comprehensive plan
  });

  const currentDate = new Date().toISOString().split("T")[0];
  const isWinterSeason =
    new Date().getMonth() >= 9 || new Date().getMonth() <= 2;

  const systemPromptEn = `You are an expert Egyptian agricultural consultant. Generate comprehensive, actionable farming plans.

Current Date: ${currentDate}
Current Season: ${
    isWinterSeason
      ? "Winter (November-March) - Good for wheat, clover, fava beans, vegetables"
      : "Summer (April-October) - Good for rice, cotton, corn, vegetables"
  }

When creating plans:
1. Use specific Egyptian locations and governorates
2. All costs in EGP (Egyptian Pounds)
3. Use feddans as land unit (1 feddan = 0.42 hectares)
4. Use ardebs for grain yields
5. Include realistic Egyptian market prices
6. Consider Egyptian climate and water availability
7. Provide month-by-month timeline
8. Include financial projections with ROI

Format the response as a comprehensive markdown plan with:
- Executive Summary
- Farm Overview (location, area, recommended crops)
- Financial Projections (costs, revenue, profit)
- Implementation Timeline (phases with specific tasks)
- Water Management
- Risk Management
- Local Resources and Tips`;

  // For Arabic, use a simpler prompt with explicit language instruction
  const systemPromptAr = `أنت مستشار زراعي مصري خبير. أنشئ خطة زراعية شاملة باللغة العربية.

التاريخ: ${currentDate}
الموسم: ${isWinterSeason ? "شتاء" : "صيف"}

المتطلبات:
- استخدم المحافظات المصرية
- التكاليف بالجنيه المصري (EGP)
- المساحة بالفدان
- المحاصيل بالأردب
- أسعار السوق المصري الواقعية

الخطة تشمل:
1. ملخص تنفيذي
2. نظرة عامة على المزرعة
3. التوقعات المالية (جدول)
4. الجدول الزمني
5. إدارة المياه
6. إدارة المخاطر

اكتب بالعربية فقط.`;

  const systemPrompt = lang === "ar" ? systemPromptAr : systemPromptEn;

  // For Arabic requests, append reminder to respond in Arabic
  const userMessage =
    lang === "ar"
      ? `${message}\n\n[Important: Please respond entirely in Arabic (العربية)]`
      : message;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userMessage),
  ]);

  return response.content;
}

/**
 * Advanced chat with farm context and conversation history
 */
export const chatWithContext = async (input, lang = "en") => {
  console.log("💬 AI Service: Processing contextual chat...");

  try {
    const validatedInput = ChatInputSchema.parse(input);
    const response = await agentChat(validatedInput, lang);

    return response;
  } catch (error) {
    console.error("❌ Contextual chat error:", error);
    throw error;
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Transform legacy business plan context to new schema format
 */
function transformLegacyBusinessPlanInput(context) {
  const { farm, crop, crops, farmId, ...rest } = context;

  // Build farm object from various sources
  let farmData = null;
  if (farm) {
    farmData = {
      id: farm._id?.toString() || farmId,
      name: farm.name,
      location: farm.location,
      fieldSizeHectares: farm.fieldSizeHectares || farm.fieldSizeFeddans * 0.42, // Convert feddans to hectares
      soil: farm.soil,
      water: farm.water,
      cropHistory: farm.cropHistory,
      currentCrops: farm.currentCrops,
    };
  }

  return {
    farm: farmData,
    crop: crop || crops?.[0],
    crops: crops || (crop ? [crop] : undefined),
    planDurationMonths: rest.planDurationMonths || 12,
    initialInvestment: rest.initialInvestment || rest.budget,
    includeAnimals: rest.includeAnimals || false,
    animals: rest.animals,
    marketStrategy: rest.marketStrategy,
    ...rest,
  };
}

/**
 * Transform legacy crop plan context to new schema format
 */
function transformLegacyCropPlanInput(context) {
  const { farm, crop, crops, ...rest } = context;

  // Build farm object
  let farmData = null;
  if (farm) {
    farmData = {
      id: farm._id?.toString(),
      name: farm.name,
      location: farm.location,
      fieldSizeHectares: farm.fieldSizeHectares || farm.fieldSizeFeddans * 0.42,
      soil: farm.soil,
      water: farm.water,
      cropHistory: farm.cropHistory,
      currentCrops: farm.currentCrops,
      constraints: farm.constraints,
    };
  }

  return {
    farm: farmData,
    targetCrops: crops || (crop ? [crop] : undefined),
    seasonStart: rest.seasonStart || rest.season?.start,
    seasonEnd: rest.seasonEnd || rest.season?.end,
    budget: rest.budget,
    prioritize: rest.prioritize || rest.priority,
    ...rest,
  };
}

// For backward compatibility
export const __setAiClient = () => {
  console.warn("__setAiClient is deprecated - using LangChain agent now");
};

export default {
  generateBusinessPlan,
  planCrops,
  chat,
  chatWithContext,
  __setAiClient,
};
