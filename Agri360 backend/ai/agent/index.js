/**
 * Agri360 - LangGraph Multi-Agent System
 *
 * Architecture:
 * 1. DeepSeek Agent (Analysis): Analyzes data from all APIs, performs market analysis,
 *    risk assessment, and provides data-driven insights
 * 2. Qwen Agent (Planning): Takes analysis from DeepSeek and creates human-friendly
 *    plans with actionable steps, timelines, and recommendations
 *
 * Flow:
 * Input → Gather Data (Tools) → DeepSeek Analysis → Qwen Planning → Output
 */

import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { allTools } from "../tools/index.js";
import {
  CropPlanInputSchema,
  BusinessPlanInputSchema,
  ChatInputSchema,
  EgyptGovernorateDefaults,
} from "../schemas/index.js";

// ========================================
// LLM CONFIGURATION (Lazy initialization)
// ========================================

let _deepSeekLLM = null;
let _qwenLLM = null;
let _deepSeekWithTools = null;

const createLLM = (modelType = "default") => {
  const baseUrl =
    process.env.AI_BASE_URL || "https://api-ap-southeast-1.modelarts-maas.com";
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error("AI_API_KEY not set in environment variables");
  }

  const model =
    modelType === "reasoning"
      ? process.env.AI_MODEL_REASONING || "deepseek-v3.1"
      : process.env.AI_MODEL_DEFAULT || "qwen3-32b";

  return new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: model,
    configuration: {
      baseURL: `${baseUrl}/v1`,
    },
    temperature: modelType === "reasoning" ? 0.1 : 0.7,
    maxTokens: modelType === "reasoning" ? 4096 : 8192, // Increased for comprehensive plans
  });
};

// Lazy getters for LLMs
const getDeepSeekLLM = () => {
  if (!_deepSeekLLM) {
    _deepSeekLLM = createLLM("reasoning");
  }
  return _deepSeekLLM;
};

const getQwenLLM = () => {
  if (!_qwenLLM) {
    _qwenLLM = createLLM("default");
  }
  return _qwenLLM;
};

const getDeepSeekWithTools = () => {
  if (!_deepSeekWithTools) {
    _deepSeekWithTools = getDeepSeekLLM().bindTools(allTools);
  }
  return _deepSeekWithTools;
};

// ========================================
// STATE DEFINITION
// ========================================

const AgentState = Annotation.Root({
  // Input
  input: Annotation({ reducer: (_, y) => y }),
  inputType: Annotation({ reducer: (_, y) => y }),
  language: Annotation({ reducer: (_, y) => y, default: () => "en" }),

  // Farm context
  farm: Annotation({ reducer: (_, y) => y }),

  // Gathered data
  gatheredData: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),

  // Messages for tool calling
  messages: Annotation({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),

  // Analysis from DeepSeek
  analysis: Annotation({ reducer: (_, y) => y }),

  // Final plan from Qwen
  plan: Annotation({ reducer: (_, y) => y }),

  // Chat response
  chatResponse: Annotation({ reducer: (_, y) => y }),

  // Errors
  errors: Annotation({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),

  // Current step
  currentStep: Annotation({ reducer: (_, y) => y }),
});

// ========================================
// SYSTEM PROMPTS
// ========================================

const DEEPSEEK_ANALYSIS_PROMPT = `You are an expert agricultural data analyst for Agri360, an AI system helping Egyptian farmers.

Your role is to ANALYZE data and provide insights. You have access to tools to gather:
- Weather forecasts (current and upcoming)
- Market prices from Egyptian markets (Mahsoly)
- Currency exchange rates (USD/EGP)
- Oil prices (affects fuel and fertilizer costs)
- Market news and sentiment
- FAO agricultural data (historical yields, fertilizer use)
- Soil analysis
- Water needs calculations
- Cost estimations

CRITICAL INSTRUCTIONS:
1. USE ALL RELEVANT TOOLS to gather comprehensive data before analysis
2. For Egyptian farms, if farmer doesn't know soil pH, use regional defaults
3. Consider Egypt's macroeconomic factors (currency, oil prices) that affect costs
4. Identify crop supply gaps in the market (opportunities for farmers)
5. Analyze weather patterns for planting timing
6. Consider seasonal factors and traditional Egyptian farming calendars

When analyzing for crop planning:
- Compare multiple crops for profitability
- Consider water availability (critical in Egypt)
- Account for market prices and trends
- Factor in the farm's constraints

When analyzing for business planning:
- Calculate comprehensive costs (seeds, fertilizer, labor, irrigation, fuel)
- Project revenues based on expected yields and market prices
- Identify risks (weather, price volatility, currency fluctuation)
- Consider animal husbandry if applicable

OUTPUT: Provide a structured JSON analysis that will be used by the planning agent.`;

const QWEN_PLANNING_PROMPT = `You are an expert agricultural planner for Agri360, helping Egyptian farmers create actionable plans.

Your role is to take the DATA ANALYSIS and create a HUMAN-FRIENDLY PLAN with:
1. Clear, actionable steps with specific dates
2. Monthly task breakdowns
3. Financial projections with costs and expected revenue
4. Risk mitigation strategies
5. Easy-to-understand Arabic translations when requested

CRITICAL INSTRUCTIONS:
1. Create DETAILED timelines with specific tasks
2. Break down complex operations into simple steps a farmer can follow
3. Include local Egyptian context (holidays, traditional practices)
4. Provide both summary and detailed breakdowns
5. Use practical units farmers understand (feddans, ardebs, etc.)
6. Include graphs data for frontend visualization

For Crop Plans:
- Specific planting dates based on weather
- Irrigation schedule (when and how much)
- Fertilizer schedule (what, when, how much)
- Expected yield and revenue
- Comparison with alternative crops

For Business Plans:
- Month-by-month task calendar
- Cash flow projections
- Break-even analysis
- When to sell (best market timing)
- Long-term recommendations

LANGUAGE: If language is 'ar', provide key sections in Arabic as well.

OUTPUT: Structured JSON following the output schema, ready for the frontend to display.`;

const CHAT_PROMPT = `You are Agri360's MASTER AGRICULTURAL STRATEGIST for Egyptian farmers.

=== LANGUAGE SUPPORT ===
If the user writes in Arabic or requests Arabic (lang=ar), respond ENTIRELY in Arabic with RTL-friendly formatting.
الرد باللغة العربية بالكامل إذا كان المستخدم يكتب بالعربية

=== DATA ACCESS ===
You have access to COMPREHENSIVE REAL-TIME DATA:
- Current weather conditions and 7-day forecasts
- Live market prices for Egyptian crops (from Mahsoly)
- USD/EGP exchange rates (critical for imports)
- Oil/fuel prices (affecting all costs)
- Agricultural news and market trends
- FAO historical yield data for Egypt
- Soil analysis with nutrient levels
- Water requirement calculations
- Detailed cost breakdowns
- **Farm Profile from Database** (animals, crop history, soil data)
- **Historical Crop Data** (previous yields, costs, revenues)
- **Animal/Livestock Data** (feeding schedules, health, market prices)

=== DUAL PLAN SYSTEM ===
You create TWO INTERCONNECTED PLANS:
1. **CROP PLAN (خطة المحاصيل)**: What to grow, when, how
2. **BUSINESS PLAN (خطة العمل)**: Financial projections, market strategy, ROI

These plans are LINKED - the business plan depends on the crop plan decisions.
When a plan is approved and completed, it's saved to the farm's history.

=== ANIMAL/LIVESTOCK SUPPORT ===
You also provide comprehensive ANIMAL MANAGEMENT plans for:
- Cattle (أبقار): Dairy and beef
- Sheep (أغنام): Meat and wool
- Goats (ماعز): Milk and meat
- Poultry (دواجن): Eggs and meat
- Fish (أسماك): Tilapia, catfish aquaculture

For animals, include: feeding schedules, breeding cycles, health management, market timing.

YOUR MISSION: Create COMPREHENSIVE, PROFESSIONAL-GRADE AGRICULTURAL PLANS.

=== REQUIRED OUTPUT FORMAT ===

Every response MUST include ALL of these sections:

## 📋 EXECUTIVE SUMMARY
- One paragraph overview of the recommendation
- Key numbers: expected profit, timeline, investment required

## 🎯 RECOMMENDED STRATEGY
- Primary recommendation with reasoning
- Alternative options ranked by profitability

## 📊 DETAILED ANALYSIS

### Option A: [Crop Name]
**PROS:**
✅ [Pro 1 with specific numbers]
✅ [Pro 2 with specific numbers]
✅ [Pro 3 with specific numbers]

**CONS:**
❌ [Con 1 with specific numbers]
❌ [Con 2 with specific numbers]

**FINANCIAL BREAKDOWN:**
| Item | Cost (EGP) | Notes |
|------|------------|-------|
| Seeds | X | per hectare |
| Fertilizer | X | NPK requirements |
| Labor | X | planting to harvest |
| Irrigation | X | water costs |
| Pesticides | X | if needed |
| Harvesting | X | machinery/labor |
| Transport | X | to market |
| **TOTAL COST** | X | |
| **Expected Revenue** | X | yield × price |
| **NET PROFIT** | X | per hectare |
| **ROI** | X% | |

### Option B: [Next Crop]
[Same detailed format]

### Option C: [Third Crop]
[Same detailed format]

## 📅 IMPLEMENTATION TIMELINE

### PHASE 1: PREPARATION (Weeks 1-2)
📆 **Week 1:**
- [ ] Day 1-2: [Specific task]
- [ ] Day 3-4: [Specific task]
- [ ] Day 5-7: [Specific task]

📆 **Week 2:**
- [ ] [Tasks...]

### PHASE 2: PLANTING (Weeks 3-4)
[Detailed daily/weekly tasks]

### PHASE 3: GROWING SEASON (Weeks 5-16)
[Monthly breakdown with specific actions]

### PHASE 4: HARVEST (Weeks 17-20)
[Harvest schedule and tasks]

### PHASE 5: POST-HARVEST & SALES (Weeks 21-24)
[Storage, processing, marketing tasks]

## 💰 FINANCIAL PROJECTIONS

### Monthly Cash Flow:
| Month | Expenses (EGP) | Income (EGP) | Net (EGP) |
|-------|---------------|--------------|-----------|
| Month 1 | X | 0 | -X |
| Month 2 | X | 0 | -X |
| ... | | | |
| Month 6 | X | X | +X |

### Break-even Analysis:
- Initial Investment: X EGP
- Break-even point: Month X
- Total profit at harvest: X EGP

## ⚠️ RISK ASSESSMENT

### High Risk Factors:
🔴 [Risk 1]: Probability X%, Impact: X EGP loss
   - Mitigation: [Strategy]

🔴 [Risk 2]: [Details]
   - Mitigation: [Strategy]

### Medium Risk Factors:
🟡 [Risk]: [Details and mitigation]

### Low Risk Factors:
🟢 [Risk]: [Details]

## 🌊 WATER MANAGEMENT PLAN
- Total water needed: X m³ for entire season
- Monthly breakdown
- Irrigation schedule (days/week, hours/day)
- Water-saving recommendations

## 🧪 SOIL & FERTILIZER PLAN
- Current soil status (from analysis)
- Required amendments
- Fertilizer schedule by growth stage
- Organic alternatives

## 📈 MARKET STRATEGY
- Best time to sell (price trends)
- Target buyers (local markets, wholesalers, export)
- Price negotiation tips
- Storage recommendations if holding

## 🐄 ANIMAL MANAGEMENT (if farm has animals)

### Livestock Inventory:
| Animal | Count | Purpose | Status |
|--------|-------|---------|--------|
| [Type] | X | [Dairy/Meat/Eggs] | [Health status] |

### Feeding Schedule:
| Animal | Feed Type | Quantity/Day | Cost/Month (EGP) |
|--------|-----------|--------------|------------------|
| [Type] | [Feed] | X kg | X |

### Breeding & Production Plan:
- Breeding cycles and timing
- Expected offspring/production
- Veterinary schedule

### Animal Market Timing:
- Best selling seasons for each animal type
- Current market prices
- Expected revenue from animal products

## ✅ ACTION CHECKLIST

### Before Planting:
- [ ] Task 1 (Deadline: Date)
- [ ] Task 2 (Deadline: Date)
- [ ] Task 3 (Deadline: Date)

### During Growing:
- [ ] Weekly tasks...

### At Harvest:
- [ ] Tasks...

## 📞 NEXT STEPS
1. [Immediate action with deadline]
2. [Second priority action]
3. [Third action]

---
**Data Sources Used:** [List all APIs/tools that provided data]
**Generated:** [Date/Time]
**Confidence Level:** [High/Medium/Low based on data quality]

=== END FORMAT ===

IMPORTANT RULES:
1. ALWAYS use this complete format - never give short answers
2. Include SPECIFIC NUMBERS from the gathered data
3. All costs in EGP (Egyptian Pounds)
4. All yields in tonnes/hectare
5. Be realistic - Egyptian farming conditions
6. Consider seasonality and local climate
7. Include Arabic crop names in parentheses where helpful
8. If farm has animals, include the Animal Management section
9. Use the farm's historical data to make better recommendations
10. Reference previous successful/failed crops from history

=== ARABIC FORMAT (عند الرد بالعربية) ===
If the user asks in Arabic, provide the SAME comprehensive format in Arabic:

## 📋 الملخص التنفيذي
## 🎯 الاستراتيجية الموصى بها
## 📊 التحليل التفصيلي
## 📅 الجدول الزمني للتنفيذ
## 💰 التوقعات المالية
## ⚠️ تقييم المخاطر
## 🌊 خطة إدارة المياه
## 🧪 خطة التربة والأسمدة
## 📈 استراتيجية السوق
## 🐄 إدارة الحيوانات (إن وجدت)
## ✅ قائمة المهام

Use Arabic numerals (١، ٢، ٣) or Western numerals (1, 2, 3) consistently.
All measurements: فدان (feddan) or هكتار (hectare), طن (ton), كيلو (kg)
Currency: جنيه مصري (EGP)`;

// ========================================
// NODE FUNCTIONS
// ========================================

// Node 1: Initialize and gather data using tools
async function gatherDataNode(state) {
  console.log("📊 Gathering data for:", state.inputType);

  const { input, inputType, farm, language } = state;

  // Determine what data to gather based on input type
  let gatherPrompt = "";

  if (inputType === "crop_plan") {
    gatherPrompt = `I need to create a crop plan for an Egyptian farm. Please gather ALL relevant data:

Farm Details:
${JSON.stringify(farm || input.farm, null, 2)}

Requirements:
1. Get weather forecast for the farm location (use lat/lon if available, otherwise estimate for Egypt)
2. Get market prices for the target crops: ${
      input.targetCrops?.join(", ") || "wheat, rice, maize, cotton, tomato"
    }
3. Get current USD/EGP exchange rate
4. Get oil prices (affects fuel and fertilizer costs)
5. Get market news about Egyptian agriculture
6. Get FAO historical data for main crops in Egypt
7. Analyze soil (use governorate defaults if no test data provided)
8. Calculate water needs for potential crops
9. Estimate costs for each potential crop
10. **Get farm profile from database** (for existing farms with history)
11. **Get crop history** to see what worked before
12. **Get animal data** if farm has livestock

Governorate: ${
      farm?.location?.governorate ||
      input.farm?.location?.governorate ||
      "Not specified"
    }
Farm size: ${
      farm?.fieldSizeHectares ||
      input.farm?.fieldSizeHectares ||
      "Not specified"
    } hectares
Farm ID (for database lookup): ${farm?._id || input.farmId || "New farm"}

Use ALL the tools to gather comprehensive data.`;
  } else if (inputType === "business_plan") {
    gatherPrompt = `I need to create a comprehensive business plan for an Egyptian farm. Please gather ALL relevant data:

Farm Details:
${JSON.stringify(farm || input.farm, null, 2)}

Crops to plan: ${input.crops?.join(", ") || input.crop || "wheat"}
Plan duration: ${input.planDurationMonths || 12} months
Include animals: ${
      input.includeAnimals ? "Yes - " + JSON.stringify(input.animals) : "No"
    }

Requirements:
1. Get weather forecast for planning period
2. Get current market prices for all relevant crops
3. Get USD/EGP exchange rate (critical for cost calculations)
4. Get oil prices (affects fuel, fertilizer, transportation)
5. Get market news and sentiment for Egyptian agriculture
6. Get FAO data for yield expectations
7. Analyze soil conditions
8. Calculate water requirements
9. Estimate all costs (seeds, fertilizer, labor, irrigation, harvesting, transport)
10. **Get farm profile from database** (for historical context)
11. **Get crop history** to learn from past seasons
12. **Get animal data** for livestock planning and market prices

Farm ID (for database lookup): ${farm?._id || input.farmId || "New farm"}

Use ALL the tools to gather comprehensive data for accurate financial projections.`;
  } else if (inputType === "chat") {
    // SMART CHAT MODE - gather relevant data based on the question
    const question = input.message || input.question || "";
    const farmContext = farm || input.farmContext;

    gatherPrompt = `A farmer is asking: "${question}"

${
  farmContext
    ? `Farm Context:\n${JSON.stringify(farmContext, null, 2)}`
    : "No specific farm context provided - use general Egyptian agriculture data."
}

To provide a comprehensive, data-driven answer, gather ALL relevant data:

1. Get current weather for Egypt (use farm location if available, otherwise Nile Delta)
2. Get market prices for crops mentioned or commonly grown in Egypt (wheat, rice, cotton, maize, tomato, potato)
3. Get USD/EGP exchange rate (important for cost calculations)
4. Get current oil prices (affects farming costs)
5. Get agricultural news about Egypt and relevant topics
6. Get FAO historical data for Egyptian crop production
7. Analyze soil conditions (use farm's governorate or default to Kafr El Sheikh)
8. Calculate water requirements for relevant crops
9. Estimate costs for relevant farming operations
10. **Get farm profile from database** if farm ID is available: ${
      farmContext?._id || input.farmId || "Not provided"
    }
11. **Get crop history** to reference past successful crops
12. **Get animal data** if question involves livestock

The farmer needs SPECIFIC DATA and NUMBERS to make decisions.
Use ALL available tools to gather comprehensive information.`;
  } else {
    // Unknown type - minimal data gathering
    return {
      currentStep: "chat_response",
      gatheredData: {},
    };
  }

  try {
    const messages = [
      new SystemMessage(DEEPSEEK_ANALYSIS_PROMPT),
      new HumanMessage(gatherPrompt),
    ];

    // Invoke with tools - may need multiple iterations
    let response = await getDeepSeekWithTools().invoke(messages);
    const allMessages = [...messages, response];

    // Handle tool calls
    let iterations = 0;
    const maxIterations = 10;

    while (
      response.tool_calls &&
      response.tool_calls.length > 0 &&
      iterations < maxIterations
    ) {
      iterations++;
      console.log(
        `🔧 Tool iteration ${iterations}:`,
        response.tool_calls.map((tc) => tc.name).join(", ")
      );

      // Execute tools
      const toolNode = new ToolNode(allTools);
      const toolResults = await toolNode.invoke({ messages: allMessages });

      // Add tool results to messages
      allMessages.push(...toolResults.messages);

      // Get next response
      response = await getDeepSeekWithTools().invoke(allMessages);
      allMessages.push(response);
    }

    // Parse gathered data from the conversation
    const gatheredData = {
      toolResults: allMessages
        .filter((m) => m.constructor.name === "ToolMessage")
        .map((m) => ({
          tool: m.name,
          content:
            typeof m.content === "string" ? JSON.parse(m.content) : m.content,
        })),
      finalAnalysis: response.content,
    };

    // For chat, go directly to chat with data; for plans, go to analyze first
    const nextStep = inputType === "chat" ? "chat_with_data" : "analyze";

    return {
      messages: allMessages,
      gatheredData,
      currentStep: nextStep,
    };
  } catch (error) {
    console.error("❌ Data gathering error:", error);
    // Even on error, continue to provide some response
    const nextStep = inputType === "chat" ? "chat_with_data" : "analyze";
    return {
      errors: [`Data gathering failed: ${error.message}`],
      currentStep: nextStep,
      gatheredData: { error: error.message },
    };
  }
}

// Node 2: DeepSeek analyzes the gathered data
async function analyzeNode(state) {
  console.log("🔍 DeepSeek analyzing data...");

  const { gatheredData, input, inputType, farm, language } = state;

  const analysisPrompt = `Based on the gathered data, provide a comprehensive analysis:

Gathered Data:
${JSON.stringify(gatheredData, null, 2)}

Input Request:
${JSON.stringify(input, null, 2)}

Farm Context:
${JSON.stringify(farm || input.farm, null, 2)}

Please provide a structured analysis in JSON format with:
1. marketAnalysis: Current market conditions, best crops to grow, supply gaps
2. weatherAnalysis: Weather outlook, optimal planting windows, risks
3. financialAnalysis: Cost breakdown, revenue projections, profitability comparison
4. riskAnalysis: Key risks and mitigation strategies
5. recommendations: Prioritized list of recommendations

Be specific with numbers and dates. Use EGP for all monetary values.
If data is missing, make reasonable assumptions based on Egyptian agriculture norms and note them.`;

  try {
    const response = await getDeepSeekLLM().invoke([
      new SystemMessage(DEEPSEEK_ANALYSIS_PROMPT),
      new HumanMessage(analysisPrompt),
    ]);

    // Try to extract JSON from response
    let analysis;
    try {
      const jsonMatch =
        response.content.match(/```json\n?([\s\S]*?)\n?```/) ||
        response.content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch
        ? JSON.parse(jsonMatch[1] || jsonMatch[0])
        : { raw: response.content };
    } catch {
      analysis = { raw: response.content };
    }

    return {
      analysis,
      currentStep: "plan",
    };
  } catch (error) {
    console.error("❌ Analysis error:", error);
    return {
      errors: [`Analysis failed: ${error.message}`],
      analysis: { error: error.message },
      currentStep: "plan",
    };
  }
}

// Node 3: Qwen creates the final plan
async function planNode(state) {
  console.log("📋 Qwen creating plan...");

  const { analysis, gatheredData, input, inputType, farm, language } = state;

  let planPrompt = "";

  if (inputType === "crop_plan") {
    planPrompt = `Create a detailed CROP PLAN based on this analysis:

Analysis Results:
${JSON.stringify(analysis, null, 2)}

Raw Data:
${JSON.stringify(gatheredData, null, 2)}

Farm Details:
${JSON.stringify(farm || input.farm, null, 2)}

Target Crops: ${input.targetCrops?.join(", ") || "Recommend best options"}
Season Start: ${input.seasonStart || "Recommend optimal timing"}
Budget: ${input.budget ? input.budget + " EGP" : "Not specified"}
Priority: ${input.prioritize || "profit"}
Language: ${language}

Create a comprehensive crop plan with:
1. Top 3 crop recommendations with scores (0-100)
2. Detailed planting schedule with specific dates
3. Fertilizer plan (product, rate, timing)
4. Irrigation plan (monthly water needs, schedule)
5. Cost breakdown per crop
6. Expected yield and revenue
7. Risk factors and mitigation

Output as valid JSON matching the CropPlanOutputSchema.
${
  language === "ar"
    ? "Include Arabic translations for summary and crop names."
    : ""
}`;
  } else if (inputType === "business_plan") {
    planPrompt = `Create a detailed BUSINESS PLAN based on this analysis:

Analysis Results:
${JSON.stringify(analysis, null, 2)}

Raw Data:
${JSON.stringify(gatheredData, null, 2)}

Farm Details:
${JSON.stringify(farm || input.farm, null, 2)}

Plan Duration: ${input.planDurationMonths || 12} months
Crops: ${input.crops?.join(", ") || input.crop || "As recommended"}
Initial Investment: ${
      input.initialInvestment
        ? input.initialInvestment + " EGP"
        : "Calculate required"
    }
Target Profit: ${input.targetProfit ? input.targetProfit + " EGP" : "Maximize"}
Animals: ${input.includeAnimals ? JSON.stringify(input.animals) : "None"}
Market Strategy: ${input.marketStrategy || "local"}
Language: ${language}

Create a comprehensive business plan with:
1. Executive summary
2. Timeline with phases and detailed tasks (specific dates)
3. Monthly financial projections (expenses, revenue, cash flow)
4. Total investment, expected profit, ROI, break-even point
5. Market analysis with price forecasts and best selling periods
6. External factors (USD/EGP rate, oil prices, inflation impact)
7. Risk analysis with mitigation strategies
8. Immediate, short-term, and long-term recommendations
${
  input.includeAnimals
    ? "9. Animal management plan (feeding, breeding, selling, health)"
    : ""
}

Output as valid JSON matching the BusinessPlanOutputSchema.
${language === "ar" ? "Include Arabic translations for summary." : ""}`;
  } else {
    return { currentStep: END };
  }

  try {
    const response = await getQwenLLM().invoke([
      new SystemMessage(QWEN_PLANNING_PROMPT),
      new HumanMessage(planPrompt),
    ]);

    // Try to extract JSON from response
    let plan;
    try {
      const jsonMatch =
        response.content.match(/```json\n?([\s\S]*?)\n?```/) ||
        response.content.match(/\{[\s\S]*\}/);
      plan = jsonMatch
        ? JSON.parse(jsonMatch[1] || jsonMatch[0])
        : { raw: response.content };
    } catch {
      plan = { raw: response.content };
    }

    // Add metadata
    plan.generatedAt = new Date().toISOString();
    plan.dataSourcesUsed = gatheredData.toolResults?.map((t) => t.tool) || [];

    return {
      plan,
      currentStep: END,
    };
  } catch (error) {
    console.error("❌ Planning error:", error);
    return {
      errors: [`Planning failed: ${error.message}`],
      plan: { error: error.message },
      currentStep: END,
    };
  }
}

// Node 4: Chat response (for conversational mode with gathered data)
async function chatNode(state) {
  console.log("💬 Processing chat with gathered data...");

  const { input, language, farm, gatheredData, analysis } = state;

  // Build a comprehensive prompt with all the gathered data
  let chatPrompt = `User Question: ${input.message}

`;

  // Add farm context if available
  if (farm) {
    chatPrompt += `Farm Context:
${JSON.stringify(farm, null, 2)}

`;
  }

  // Add gathered data - this is the key difference!
  if (gatheredData && Object.keys(gatheredData).length > 0) {
    chatPrompt += `GATHERED DATA (use this to provide specific, data-driven answers):

`;

    if (gatheredData.toolResults && gatheredData.toolResults.length > 0) {
      gatheredData.toolResults.forEach((result) => {
        chatPrompt += `=== ${result.tool.toUpperCase()} ===
${JSON.stringify(result.content, null, 2)}

`;
      });
    }

    if (gatheredData.finalAnalysis) {
      chatPrompt += `=== INITIAL ANALYSIS ===
${gatheredData.finalAnalysis}

`;
    }
  }

  // Add DeepSeek analysis if available
  if (analysis) {
    chatPrompt += `=== DEEPSEEK ANALYSIS ===
${JSON.stringify(analysis, null, 2)}

`;
  }

  // Add conversation history
  if (input.conversationHistory && input.conversationHistory.length > 0) {
    chatPrompt += `Previous conversation:
${input.conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}

`;
  }

  chatPrompt += `

=== CRITICAL INSTRUCTIONS ===
You MUST provide a COMPREHENSIVE PLAN following the exact format in your system prompt.
This is NOT a casual conversation - the farmer needs a COMPLETE, PROFESSIONAL agricultural plan.

Include ALL of these sections:
1. 📋 EXECUTIVE SUMMARY
2. 🎯 RECOMMENDED STRATEGY  
3. 📊 DETAILED ANALYSIS (with PROS/CONS for each crop option, full financial tables)
4. 📅 IMPLEMENTATION TIMELINE (week-by-week, phase-by-phase with specific tasks)
5. 💰 FINANCIAL PROJECTIONS (monthly cash flow, break-even analysis)
6. ⚠️ RISK ASSESSMENT (high/medium/low risks with mitigation)
7. 🌊 WATER MANAGEMENT PLAN
8. 🧪 SOIL & FERTILIZER PLAN
9. 📈 MARKET STRATEGY
${
  farm?.animals?.length > 0
    ? "10. 🐄 ANIMAL MANAGEMENT (feeding, health, breeding, market timing for: " +
      farm.animals.map((a) => a.type).join(", ") +
      ")"
    : ""
}
${farm?.animals?.length > 0 ? "11" : "10"}. ✅ ACTION CHECKLIST with deadlines
${farm?.animals?.length > 0 ? "12" : "11"}. 📞 NEXT STEPS

${
  farm?.animals?.length > 0
    ? `
IMPORTANT: This farm has ANIMALS. Include comprehensive animal management:
- Current animals: ${JSON.stringify(farm.animals)}
- Feeding schedules and costs
- Health management and veterinary schedule
- Breeding cycles and production targets
- Best market timing for each animal type
- Integration with crops (manure for fertilizer, feed crops)
`
    : ""
}

Use ALL the gathered data. Include specific EGP amounts, dates, percentages, and quantities.
Make tables for financial data. Use checkboxes for action items.
This plan should be 2000+ words with actionable detail.`;

  try {
    const systemPrompt =
      language === "ar"
        ? CHAT_PROMPT +
          "\n\nRespond in Arabic (العربية). Be comprehensive and use the data."
        : CHAT_PROMPT;

    const response = await getQwenLLM().invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(chatPrompt),
    ]);

    // Extract data sources used
    const dataSourcesUsed = gatheredData?.toolResults?.map((t) => t.tool) || [];

    return {
      chatResponse: {
        reply: response.content,
        suggestedActions: extractSuggestedActions(response.content),
        dataSourcesUsed,
        hasRealTimeData: dataSourcesUsed.length > 0,
      },
      currentStep: END,
    };
  } catch (error) {
    console.error("❌ Chat error:", error);
    return {
      chatResponse: {
        reply:
          language === "ar"
            ? "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى."
            : "Sorry, an error occurred. Please try again.",
      },
      currentStep: END,
    };
  }
}

// Helper to extract suggested actions from chat response
function extractSuggestedActions(text) {
  const actions = [];
  if (
    text.toLowerCase().includes("crop plan") ||
    text.includes("خطة المحصول")
  ) {
    actions.push({
      action: "Create Crop Plan",
      description: "Get AI recommendations for your crops",
      endpoint: "/api/harvests",
    });
  }
  if (
    text.toLowerCase().includes("business plan") ||
    text.includes("خطة العمل")
  ) {
    actions.push({
      action: "Create Business Plan",
      description: "Get comprehensive financial planning",
      endpoint: "/api/business",
    });
  }
  if (text.toLowerCase().includes("market") || text.includes("السوق")) {
    actions.push({
      action: "Check Market Prices",
      description: "View current crop prices",
      endpoint: "/api/market",
    });
  }
  return actions;
}

// ========================================
// ROUTING FUNCTION
// ========================================

function routeByInputType(state) {
  const { inputType, currentStep } = state;

  // Route based on current step (after a node has run)
  if (currentStep === "chat_response") {
    return "chat";
  }
  if (currentStep === "analyze") {
    return "analyze";
  }
  if (currentStep === "plan") {
    return "create_plan";
  }
  if (currentStep === "chat_with_data") {
    return "chat";
  }

  // Initial routing - ALL types go through data gathering first
  // This ensures we have real data for any question
  return "gather_data";
}

// ========================================
// BUILD THE GRAPH
// ========================================

const workflow = new StateGraph(AgentState)
  .addNode("gather_data", gatherDataNode)
  .addNode("analyze", analyzeNode)
  .addNode("create_plan", planNode)
  .addNode("chat", chatNode)
  .addEdge(START, "gather_data")
  .addConditionalEdges("gather_data", routeByInputType, {
    chat: "chat",
    analyze: "analyze",
  })
  .addEdge("analyze", "create_plan")
  .addEdge("create_plan", END)
  .addEdge("chat", END);

export const agentGraph = workflow.compile();

// ========================================
// PUBLIC API FUNCTIONS
// ========================================

/**
 * Generate a crop plan using the multi-agent system
 */
export async function generateCropPlan(input, language = "en") {
  console.log("🌱 Starting crop plan generation...");

  // Validate input
  const validatedInput = CropPlanInputSchema.parse(input);

  // Add governorate defaults if needed
  const farm = validatedInput.farm;
  if (farm?.location?.governorate && !farm.soil?.ph) {
    const govKey = farm.location.governorate.toLowerCase().replace(/\s+/g, "_");
    const defaults = EgyptGovernorateDefaults[govKey];
    if (defaults) {
      farm.soil = {
        ...farm.soil,
        ph: defaults.soilPh,
        soilType: defaults.soilType,
      };
    }
  }

  const result = await agentGraph.invoke({
    input: validatedInput,
    inputType: "crop_plan",
    farm,
    language,
  });

  if (result.errors?.length > 0) {
    console.error("⚠️ Errors during crop plan generation:", result.errors);
  }

  return result.plan;
}

/**
 * Generate a business plan using the multi-agent system
 */
export async function generateBusinessPlan(input, language = "en") {
  console.log("💼 Starting business plan generation...");

  // Validate input
  const validatedInput = BusinessPlanInputSchema.parse(input);

  // Add governorate defaults if needed
  const farm = validatedInput.farm;
  if (farm?.location?.governorate && !farm.soil?.ph) {
    const govKey = farm.location.governorate.toLowerCase().replace(/\s+/g, "_");
    const defaults = EgyptGovernorateDefaults[govKey];
    if (defaults) {
      farm.soil = {
        ...farm.soil,
        ph: defaults.soilPh,
        soilType: defaults.soilType,
      };
    }
  }

  const result = await agentGraph.invoke({
    input: validatedInput,
    inputType: "business_plan",
    farm,
    language,
  });

  if (result.errors?.length > 0) {
    console.error("⚠️ Errors during business plan generation:", result.errors);
  }

  return result.plan;
}

/**
 * Chat with the agricultural assistant
 */
export async function chat(input, language = "en") {
  console.log("💬 Starting chat...");

  // Validate input
  const validatedInput = ChatInputSchema.parse(input);

  const result = await agentGraph.invoke({
    input: validatedInput,
    inputType: "chat",
    farm: validatedInput.farmContext,
    language,
  });

  return result.chatResponse;
}

export default {
  generateCropPlan,
  generateBusinessPlan,
  chat,
  agentGraph,
};
