/**
 * Agri360 - LangChain Tools
 * Tools for the AI agent to gather data from external APIs
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";

// Import models for database access
import Farm from "../../models/Farm.js";
import HarvestPlan from "../../models/HarvestPlan.js";
import BusinessPlan from "../../models/BusinessPlan.js";

// ========================================
// WEATHER TOOL
// ========================================

export const getWeatherTool = tool(
  async ({ lat, lon, days = 7 }) => {
    try {
      // Try WeatherAPI first
      const weatherApiKey = process.env.WEATHER_API_KEY;
      if (weatherApiKey) {
        const response = await axios.get(
          `https://api.weatherapi.com/v1/forecast.json`,
          {
            params: {
              key: weatherApiKey,
              q: `${lat},${lon}`,
              days: Math.min(days, 14),
              aqi: "yes",
            },
            timeout: 10000,
          }
        );

        const data = response.data;
        return JSON.stringify({
          source: "weatherapi",
          location: {
            name: data.location.name,
            region: data.location.region,
            country: data.location.country,
          },
          current: {
            tempC: data.current.temp_c,
            humidity: data.current.humidity,
            windKph: data.current.wind_kph,
            condition: data.current.condition.text,
            precipMm: data.current.precip_mm,
          },
          forecast: data.forecast.forecastday.map((day) => ({
            date: day.date,
            maxTempC: day.day.maxtemp_c,
            minTempC: day.day.mintemp_c,
            avgTempC: day.day.avgtemp_c,
            maxWindKph: day.day.maxwind_kph,
            totalPrecipMm: day.day.totalprecip_mm,
            avgHumidity: day.day.avghumidity,
            chanceOfRain: day.day.daily_chance_of_rain,
            condition: day.day.condition.text,
          })),
        });
      }

      // Fallback to Open-Meteo (free, no key)
      const openMeteoUrl =
        process.env.OPEN_METEO_ENDPOINT ||
        "https://api.open-meteo.com/v1/forecast";
      const response = await axios.get(openMeteoUrl, {
        params: {
          latitude: lat,
          longitude: lon,
          daily:
            "temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean",
          timezone: "Africa/Cairo",
          forecast_days: days,
        },
        timeout: 10000,
      });

      const data = response.data;
      return JSON.stringify({
        source: "open-meteo",
        location: { lat, lon },
        forecast: data.daily.time.map((date, i) => ({
          date,
          maxTempC: data.daily.temperature_2m_max[i],
          minTempC: data.daily.temperature_2m_min[i],
          precipMm: data.daily.precipitation_sum[i],
          humidity: data.daily.relative_humidity_2m_mean?.[i],
        })),
      });
    } catch (error) {
      return JSON.stringify({
        error: `Weather API error: ${error.message}`,
        fallback: {
          avgTempC: 25,
          precipMm: 0,
          note: "Using Egypt average defaults due to API error",
        },
      });
    }
  },
  {
    name: "get_weather",
    description:
      "Get current weather and forecast for a location. Essential for crop planning to determine planting dates, irrigation needs, and harvest timing.",
    schema: z.object({
      lat: z.number().describe("Latitude of the farm location"),
      lon: z.number().describe("Longitude of the farm location"),
      days: z.number().default(7).describe("Number of forecast days (max 14)"),
    }),
  }
);

// ========================================
// MARKET PRICES TOOL (MAHSOLY)
// ========================================

export const getMarketPricesTool = tool(
  async ({ crop, categoryName = "" }) => {
    try {
      const mahsolyBase = process.env.MAHSOLY_API || "https://api.mahsoly.com";
      const userId = process.env.MAHSOLY_USERID || 0;

      // Get stock market prices
      const stockResponse = await axios.get(`${mahsolyBase}/stockmarket`, {
        timeout: 10000,
      });

      const allPrices = stockResponse.data || [];

      // Filter for requested crop if specified
      let filteredPrices = allPrices;
      if (crop) {
        const cropLower = crop.toLowerCase();
        filteredPrices = allPrices.filter(
          (p) =>
            p.name?.toLowerCase().includes(cropLower) ||
            p.item_name?.toLowerCase().includes(cropLower) ||
            p.name_ar?.includes(crop) ||
            p.category?.toLowerCase().includes(cropLower)
        );
      }

      // Also get item details
      const itemsResponse = await axios.post(
        `${mahsolyBase}/item/all`,
        {
          categoryName,
          name: crop || "",
          size: 50,
          userid: userId,
        },
        {
          headers: { "Content-Type": "application/json; charset=UTF-8" },
          timeout: 10000,
        }
      );

      const items = itemsResponse.data || [];

      return JSON.stringify({
        source: "mahsoly",
        currency: "EGP",
        timestamp: new Date().toISOString(),
        stockPrices: filteredPrices.slice(0, 20).map((p) => ({
          name: p.name || p.item_name,
          nameAr: p.name_ar,
          price: p.price || p.current_price,
          unit: p.unit || "kg",
          market: p.market || p.location,
          date: p.date || p.updated_at,
        })),
        items: items.slice(0, 20).map((item) => ({
          id: item.id,
          name: item.name,
          nameAr: item.name_ar,
          category: item.category,
          avgPrice: item.avg_price,
          minPrice: item.min_price,
          maxPrice: item.max_price,
        })),
        summary: {
          totalItems: filteredPrices.length,
          searchedCrop: crop,
        },
      });
    } catch (error) {
      // Return useful mock data for common Egyptian crops
      const mockPrices = {
        wheat: { price: 12000, unit: "tonne" },
        قمح: { price: 12000, unit: "tonne" },
        rice: { price: 18000, unit: "tonne" },
        أرز: { price: 18000, unit: "tonne" },
        cotton: { price: 35000, unit: "tonne" },
        قطن: { price: 35000, unit: "tonne" },
        maize: { price: 9000, unit: "tonne" },
        ذرة: { price: 9000, unit: "tonne" },
        tomato: { price: 8000, unit: "tonne" },
        طماطم: { price: 8000, unit: "tonne" },
        potato: { price: 6000, unit: "tonne" },
        بطاطس: { price: 6000, unit: "tonne" },
      };

      const cropLower = crop?.toLowerCase() || "";
      const mockPrice = mockPrices[cropLower] ||
        mockPrices[crop] || { price: 10000, unit: "tonne" };

      return JSON.stringify({
        source: "fallback",
        error: `Mahsoly API error: ${error.message}`,
        currency: "EGP",
        timestamp: new Date().toISOString(),
        stockPrices: [
          {
            name: crop,
            price: mockPrice.price,
            unit: mockPrice.unit,
            note: "Estimated price - API unavailable",
          },
        ],
        note: "Using estimated Egyptian market prices due to API error",
      });
    }
  },
  {
    name: "get_market_prices",
    description:
      "Get current crop prices from Egyptian markets (Mahsoly). Use this to analyze market conditions, find profitable crops, and identify supply gaps.",
    schema: z.object({
      crop: z
        .string()
        .optional()
        .describe("Crop name to search for (e.g., wheat, قمح, rice, tomato)"),
      categoryName: z
        .string()
        .optional()
        .describe("Category to filter (e.g., grains, vegetables)"),
    }),
  }
);

// ========================================
// FOREX TOOL
// ========================================

export const getForexRateTool = tool(
  async ({ base = "USD", target = "EGP" }) => {
    try {
      const apiKey = process.env.CURRENCY_API_KEY;
      const apiBase =
        process.env.CURRENCY_API_BASE ||
        "https://api.currencyfreaks.com/v2.0/rates/latest";

      if (apiKey) {
        const response = await axios.get(
          `${apiBase}?apikey=${apiKey}&base=${base}`,
          {
            timeout: 10000,
          }
        );

        const rate = response.data.rates?.[target];
        return JSON.stringify({
          source: "currencyfreaks",
          base,
          target,
          rate: parseFloat(rate),
          timestamp: new Date().toISOString(),
          trend: "Check recent rates for trend",
        });
      }

      // Fallback to free API
      const fallbackUrl =
        process.env.EXCHANGE_API || "https://open.er-api.com/v6/latest/USD";
      const response = await axios.get(fallbackUrl, { timeout: 10000 });
      const rate = response.data.rates?.[target];

      return JSON.stringify({
        source: "open-exchange",
        base,
        target,
        rate: parseFloat(rate),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Use approximate current rate as fallback
      return JSON.stringify({
        source: "fallback",
        error: `Forex API error: ${error.message}`,
        base,
        target,
        rate: target === "EGP" ? 50.5 : 1, // Approximate USD/EGP rate
        note: "Using estimated rate - verify current rates",
        timestamp: new Date().toISOString(),
      });
    }
  },
  {
    name: "get_forex_rate",
    description:
      "Get current currency exchange rates. Essential for calculating costs that involve imported materials (fertilizers, fuel) and for export planning.",
    schema: z.object({
      base: z.string().default("USD").describe("Base currency (default USD)"),
      target: z
        .string()
        .default("EGP")
        .describe("Target currency (default EGP - Egyptian Pound)"),
    }),
  }
);

// ========================================
// OIL PRICES TOOL
// ========================================

export const getOilPriceTool = tool(
  async () => {
    try {
      const apiKey = process.env.OIL_PRICE_API_KEY;
      const apiUrl =
        process.env.OIL_PRICE_API ||
        "https://api.oilpriceapi.com/v1/prices/latest";

      if (!apiKey) {
        throw new Error("OIL_PRICE_API_KEY not configured");
      }

      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Token ${apiKey}` },
        timeout: 10000,
      });

      return JSON.stringify({
        source: "oilpriceapi",
        brentUSD: response.data.brent_price || response.data.brent,
        wtiUSD: response.data.wti_price || response.data.wti,
        timestamp: response.data.timestamp || new Date().toISOString(),
        impact:
          "Oil prices affect fuel, fertilizer, and transportation costs for farming.",
      });
    } catch (error) {
      return JSON.stringify({
        source: "fallback",
        error: `Oil API error: ${error.message}`,
        brentUSD: 75,
        wtiUSD: 70,
        note: "Using estimated prices - affects fuel and fertilizer costs",
        timestamp: new Date().toISOString(),
      });
    }
  },
  {
    name: "get_oil_price",
    description:
      "Get current oil prices (Brent, WTI). Oil prices directly impact fuel costs for farm equipment and transportation, and indirectly affect fertilizer prices.",
    schema: z.object({}),
  }
);

// ========================================
// NEWS & SENTIMENT TOOL
// ========================================

export const getMarketNewsTool = tool(
  async ({ query, limit = 10 }) => {
    try {
      const apiKey = process.env.MARKETAUX_API_KEY;
      const apiUrl =
        process.env.MARKETAUX_API || "https://api.marketaux.com/v1/news/all";

      if (!apiKey) {
        throw new Error("MARKETAUX_API_KEY not configured");
      }

      const searchTerms = query || "egypt agriculture crops commodity prices";
      const response = await axios.get(apiUrl, {
        params: {
          api_token: apiKey,
          search: searchTerms,
          filter_entities: "true",
          language: "en",
          limit: limit,
        },
        timeout: 15000,
      });

      const articles = response.data.data || [];

      // Analyze sentiment
      const text = articles
        .map((a) => `${a.title || ""} ${a.description || ""}`)
        .join(" ");
      const positiveWords = [
        "growth",
        "increase",
        "rise",
        "gain",
        "bullish",
        "strong",
        "recover",
        "profit",
        "surge",
      ];
      const negativeWords = [
        "decline",
        "drop",
        "fall",
        "loss",
        "bearish",
        "weak",
        "crisis",
        "shortage",
        "risk",
      ];

      const positiveCount = positiveWords.reduce(
        (count, word) =>
          count +
          (text.toLowerCase().match(new RegExp(word, "gi")) || []).length,
        0
      );
      const negativeCount = negativeWords.reduce(
        (count, word) =>
          count +
          (text.toLowerCase().match(new RegExp(word, "gi")) || []).length,
        0
      );

      const sentimentScore = positiveCount - negativeCount;
      const sentiment =
        sentimentScore > 2
          ? "positive"
          : sentimentScore < -2
          ? "negative"
          : "neutral";

      return JSON.stringify({
        source: "marketaux",
        query: searchTerms,
        sentiment: {
          score: sentimentScore,
          label: sentiment,
          positiveIndicators: positiveCount,
          negativeIndicators: negativeCount,
        },
        articles: articles.slice(0, limit).map((a) => ({
          title: a.title,
          description: a.description?.substring(0, 200),
          source: a.source,
          publishedAt: a.published_at,
          url: a.url,
        })),
        summary: `Found ${articles.length} articles. Overall market sentiment: ${sentiment}`,
      });
    } catch (error) {
      return JSON.stringify({
        source: "fallback",
        error: `News API error: ${error.message}`,
        sentiment: { label: "neutral", score: 0 },
        articles: [],
        note: "Unable to fetch market news - consider checking manually",
      });
    }
  },
  {
    name: "get_market_news",
    description:
      "Get market news and sentiment analysis for agricultural commodities. Helps identify market trends, policy changes, and global events affecting Egyptian agriculture.",
    schema: z.object({
      query: z
        .string()
        .optional()
        .describe('Search query (e.g., "egypt wheat prices", "cotton export")'),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of articles to return"),
    }),
  }
);

// ========================================
// FAO DATA TOOL
// ========================================

export const getFaoDataTool = tool(
  async ({ crop, dataType = "production", years = 5 }) => {
    try {
      const faoBase = "https://fenixservices.fao.org/faostat/api/v1/en";

      // Map crop names to FAO codes
      const cropCodes = {
        wheat: 15,
        قمح: 15,
        maize: 56,
        ذرة: 56,
        rice: 27,
        أرز: 27,
        cotton: 328,
        قطن: 328,
        sugarcane: 156,
        "قصب السكر": 156,
        tomato: 388,
        طماطم: 388,
        potato: 116,
        بطاطس: 116,
      };

      const datasetCodes = {
        production: "QCL",
        fertilizer: "RFB",
        land: "RL",
        prices: "PP",
      };

      const cropCode = cropCodes[crop?.toLowerCase()] || cropCodes[crop] || 15;
      const dataset = datasetCodes[dataType] || "QCL";

      const response = await axios.get(`${faoBase}/data/${dataset}`, {
        params: {
          area: 59, // Egypt
          item: cropCode,
          year: Array.from({ length: years }, (_, i) => 2024 - i).join(","),
        },
        timeout: 15000,
      });

      const data = response.data.data || [];

      return JSON.stringify({
        source: "faostat",
        crop,
        dataType,
        country: "Egypt",
        years: years,
        data: data.map((d) => ({
          year: d.Year,
          value: d.Value,
          element: d.Element,
          unit: d.Unit,
        })),
        summary: `Retrieved ${data.length} ${dataType} records for ${crop} in Egypt`,
      });
    } catch (error) {
      // Provide useful fallback data for Egypt
      const fallbackData = {
        wheat: { avgYield: 6.5, area: 1400000 },
        rice: { avgYield: 9.5, area: 500000 },
        maize: { avgYield: 7.8, area: 900000 },
        cotton: { avgYield: 2.2, area: 120000 },
      };

      const cropData = fallbackData[crop?.toLowerCase()] || {
        avgYield: 5,
        area: 100000,
      };

      return JSON.stringify({
        source: "fallback",
        error: `FAO API error: ${error.message}`,
        crop,
        country: "Egypt",
        estimatedData: {
          averageYieldTonnesPerHa: cropData.avgYield,
          typicalAreaHectares: cropData.area,
          note: "Using Egypt agricultural averages",
        },
      });
    }
  },
  {
    name: "get_fao_data",
    description:
      "Get historical agricultural data from FAO (production, yields, land use, fertilizer use). Useful for understanding typical yields, comparing farm performance, and planning.",
    schema: z.object({
      crop: z.string().describe("Crop name (e.g., wheat, rice, cotton)"),
      dataType: z
        .enum(["production", "fertilizer", "land", "prices"])
        .default("production"),
      years: z
        .number()
        .default(5)
        .describe("Number of years of historical data"),
    }),
  }
);

// ========================================
// SOIL ANALYSIS TOOL
// ========================================

export const analyzeSoilTool = tool(
  async ({
    ph,
    nitrogen,
    phosphorus,
    potassium,
    organicMatter,
    soilType,
    governorate,
  }) => {
    // Get defaults from governorate if data not provided
    const governorateDefaults = {
      kafr_el_sheikh: { ph: 7.8, soilType: "clay" },
      dakahlia: { ph: 7.5, soilType: "alluvial" },
      sharqia: { ph: 7.6, soilType: "sandy_loam" },
      beheira: { ph: 7.9, soilType: "clay_loam" },
      fayoum: { ph: 7.8, soilType: "clay_loam" },
      minya: { ph: 7.7, soilType: "clay" },
      aswan: { ph: 8.2, soilType: "sandy" },
    };

    const defaults = governorateDefaults[
      governorate?.toLowerCase()?.replace(/\s+/g, "_")
    ] || { ph: 7.5, soilType: "loam" };

    const actualPh = ph || defaults.ph;
    const actualSoilType = soilType || defaults.soilType;

    const recommendations = [];
    const warnings = [];

    // pH analysis
    if (actualPh < 6.0) {
      recommendations.push(
        "Apply agricultural lime (2-4 tonnes/ha) to raise pH"
      );
      warnings.push("Acidic soil may limit nutrient availability");
    } else if (actualPh > 8.0) {
      recommendations.push("Consider gypsum or sulfur to lower pH");
      warnings.push("Alkaline soil may cause iron and zinc deficiency");
    }

    // Nutrient analysis
    if (nitrogen !== undefined && nitrogen < 20) {
      recommendations.push(
        "Apply nitrogen fertilizer (urea or ammonium nitrate)"
      );
    }
    if (phosphorus !== undefined && phosphorus < 15) {
      recommendations.push("Apply phosphorus fertilizer (superphosphate)");
    }
    if (potassium !== undefined && potassium < 100) {
      recommendations.push("Apply potassium fertilizer (potassium sulfate)");
    }
    if (organicMatter !== undefined && organicMatter < 2) {
      recommendations.push(
        "Incorporate compost or animal manure to improve soil structure"
      );
    }

    // Crop suitability based on soil type
    const cropSuitability = {
      clay: ["rice", "wheat", "cotton", "sugar beet"],
      sandy: ["peanuts", "watermelon", "carrot", "onion"],
      loam: ["most crops", "vegetables", "fruits"],
      clay_loam: ["wheat", "corn", "soybean", "vegetables"],
      sandy_loam: ["potato", "tomato", "pepper", "cucumber"],
      alluvial: ["rice", "wheat", "vegetables", "sugarcane"],
    };

    return JSON.stringify({
      analysis: {
        ph: actualPh,
        soilType: actualSoilType,
        nitrogen: nitrogen || "not tested",
        phosphorus: phosphorus || "not tested",
        potassium: potassium || "not tested",
        organicMatter: organicMatter || "not tested",
      },
      governorateDefaults: governorate ? defaults : null,
      recommendations,
      warnings,
      suitableCrops: cropSuitability[actualSoilType] || cropSuitability["loam"],
      note: !ph
        ? `Using typical pH for ${governorate || "Egypt"}: ${actualPh}`
        : null,
    });
  },
  {
    name: "analyze_soil",
    description:
      "Analyze soil data and provide recommendations. If farmer does not know exact values, uses regional defaults based on Egyptian governorate.",
    schema: z.object({
      ph: z.number().optional().describe("Soil pH (0-14)"),
      nitrogen: z.number().optional().describe("Nitrogen content in ppm"),
      phosphorus: z.number().optional().describe("Phosphorus content in ppm"),
      potassium: z.number().optional().describe("Potassium content in ppm"),
      organicMatter: z
        .number()
        .optional()
        .describe("Organic matter percentage"),
      soilType: z
        .string()
        .optional()
        .describe("Soil type (clay, sandy, loam, etc.)"),
      governorate: z
        .string()
        .optional()
        .describe("Egyptian governorate for regional defaults"),
    }),
  }
);

// ========================================
// WATER NEEDS CALCULATION TOOL
// ========================================

export const calculateWaterNeedsTool = tool(
  async ({
    crop,
    areaHectares,
    irrigationType,
    seasonMonths = 4,
    avgTempC = 25,
  }) => {
    // Water requirements per hectare per season (m³) for common Egyptian crops
    const cropWaterNeeds = {
      wheat: { base: 4500, critical: ["tillering", "flowering"] },
      قمح: { base: 4500, critical: ["tillering", "flowering"] },
      rice: { base: 12000, critical: ["transplanting", "flowering"] },
      أرز: { base: 12000, critical: ["transplanting", "flowering"] },
      maize: { base: 6000, critical: ["tasseling", "grain_fill"] },
      ذرة: { base: 6000, critical: ["tasseling", "grain_fill"] },
      cotton: { base: 7500, critical: ["flowering", "boll_formation"] },
      قطن: { base: 7500, critical: ["flowering", "boll_formation"] },
      tomato: { base: 6500, critical: ["flowering", "fruit_set"] },
      طماطم: { base: 6500, critical: ["flowering", "fruit_set"] },
      potato: { base: 5000, critical: ["tuber_initiation", "tuber_bulking"] },
      بطاطس: { base: 5000, critical: ["tuber_initiation", "tuber_bulking"] },
      sugarcane: { base: 20000, critical: ["grand_growth"] },
      clover: { base: 8000, critical: ["each_cut"] },
      برسيم: { base: 8000, critical: ["each_cut"] },
    };

    const irrigationEfficiency = {
      flood: 0.5,
      furrow: 0.6,
      sprinkler: 0.75,
      drip: 0.9,
      pivot: 0.85,
    };

    const cropData = cropWaterNeeds[crop?.toLowerCase()] ||
      cropWaterNeeds[crop] || { base: 5500, critical: [] };
    const efficiency =
      irrigationEfficiency[irrigationType?.toLowerCase()] || 0.7;

    // Adjust for temperature
    const tempFactor = avgTempC > 30 ? 1.2 : avgTempC > 25 ? 1.1 : 1.0;

    const totalWaterNeed = cropData.base * areaHectares * tempFactor;
    const actualWaterRequired = totalWaterNeed / efficiency;

    // Monthly distribution (simplified)
    const monthlyDistribution = {};
    const monthNames = [
      "Month 1",
      "Month 2",
      "Month 3",
      "Month 4",
      "Month 5",
      "Month 6",
    ];
    for (let i = 0; i < seasonMonths; i++) {
      const factor =
        i === 0
          ? 0.15
          : i === seasonMonths - 1
          ? 0.15
          : 0.7 / (seasonMonths - 2);
      monthlyDistribution[monthNames[i]] = Math.round(
        actualWaterRequired * factor
      );
    }

    return JSON.stringify({
      crop,
      areaHectares,
      irrigationType: irrigationType || "flood (assumed)",
      irrigationEfficiency: efficiency,
      waterRequirements: {
        baseNeedM3PerHa: cropData.base,
        totalNeedM3: Math.round(totalWaterNeed),
        actualRequiredM3: Math.round(actualWaterRequired),
        monthlyDistributionM3: monthlyDistribution,
      },
      criticalStages: cropData.critical,
      recommendations: [
        efficiency < 0.7
          ? "Consider upgrading to drip irrigation to save 30-40% water"
          : null,
        avgTempC > 30
          ? "High temperatures increase water needs - irrigate early morning or evening"
          : null,
        "Monitor soil moisture at critical growth stages",
        "Mulching can reduce water needs by 20-30%",
      ].filter(Boolean),
      temperatureAdjustment:
        tempFactor > 1
          ? `+${Math.round((tempFactor - 1) * 100)}% due to high temperature`
          : "No adjustment",
    });
  },
  {
    name: "calculate_water_needs",
    description:
      "Calculate irrigation water requirements for a crop. Accounts for crop type, farm size, irrigation method, and temperature.",
    schema: z.object({
      crop: z.string().describe("Crop name"),
      areaHectares: z.number().describe("Farm area in hectares"),
      irrigationType: z
        .enum(["flood", "furrow", "sprinkler", "drip", "pivot"])
        .optional(),
      seasonMonths: z
        .number()
        .default(4)
        .describe("Growing season length in months"),
      avgTempC: z
        .number()
        .default(25)
        .describe("Average temperature in Celsius"),
    }),
  }
);

// ========================================
// COST ESTIMATION TOOL
// ========================================

export const estimateCostsTool = tool(
  async ({ crop, areaHectares, usdToEgp = 50 }) => {
    // Current estimated costs for Egyptian agriculture (EGP/hectare)
    const cropCosts = {
      wheat: {
        seeds: 3500,
        fertilizer: 8000,
        pesticides: 2000,
        labor: 5000,
        irrigation: 3000,
        harvesting: 4000,
        transport: 1500,
      },
      rice: {
        seeds: 4000,
        fertilizer: 10000,
        pesticides: 3000,
        labor: 8000,
        irrigation: 5000,
        harvesting: 5000,
        transport: 2000,
      },
      cotton: {
        seeds: 2500,
        fertilizer: 12000,
        pesticides: 5000,
        labor: 12000,
        irrigation: 4000,
        harvesting: 8000,
        transport: 2500,
      },
      maize: {
        seeds: 4500,
        fertilizer: 9000,
        pesticides: 2500,
        labor: 4500,
        irrigation: 3500,
        harvesting: 3500,
        transport: 1500,
      },
      tomato: {
        seeds: 8000,
        fertilizer: 15000,
        pesticides: 6000,
        labor: 15000,
        irrigation: 4500,
        harvesting: 10000,
        transport: 3000,
      },
      potato: {
        seeds: 25000,
        fertilizer: 12000,
        pesticides: 4000,
        labor: 10000,
        irrigation: 4000,
        harvesting: 6000,
        transport: 2500,
      },
    };

    const defaultCosts = {
      seeds: 5000,
      fertilizer: 10000,
      pesticides: 3000,
      labor: 7000,
      irrigation: 4000,
      harvesting: 5000,
      transport: 2000,
    };

    const costs = cropCosts[crop?.toLowerCase()] || defaultCosts;

    const perHectareCosts = { ...costs };
    const totalCosts = {};
    let grandTotal = 0;

    for (const [key, value] of Object.entries(perHectareCosts)) {
      totalCosts[key] = Math.round(value * areaHectares);
      grandTotal += totalCosts[key];
    }

    return JSON.stringify({
      crop,
      areaHectares,
      currency: "EGP",
      usdToEgp,
      perHectareCosts,
      totalCosts,
      grandTotal,
      grandTotalUSD: Math.round(grandTotal / usdToEgp),
      costBreakdown: Object.entries(totalCosts).map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / grandTotal) * 100),
      })),
      notes: [
        "Costs based on current Egyptian market rates",
        "Actual costs may vary by region and season",
        `Exchange rate used: 1 USD = ${usdToEgp} EGP`,
      ],
    });
  },
  {
    name: "estimate_costs",
    description:
      "Estimate farming costs for a crop including seeds, fertilizer, labor, irrigation, and harvesting.",
    schema: z.object({
      crop: z.string().describe("Crop name"),
      areaHectares: z.number().describe("Farm area in hectares"),
      usdToEgp: z.number().default(50).describe("USD to EGP exchange rate"),
    }),
  }
);

// ========================================
// ANIMAL MANAGEMENT TOOL
// ========================================

export const getAnimalDataTool = tool(
  async ({ animalType, purpose, count }) => {
    // Animal data for Egyptian farming context
    const animalData = {
      cattle: {
        nameArabic: "ماشية / أبقار",
        breeds: {
          meat: ["Baladi", "Friesian Cross", "Angus"],
          dairy: ["Holstein", "Friesian", "Brown Swiss"],
        },
        costs: {
          purchasePrice: { min: 25000, max: 60000, unit: "EGP/head" },
          feedPerDay: { amount: 15, unit: "kg", costPerKg: 8 },
          veterinary: { monthly: 200, unit: "EGP/head" },
          housing: { initial: 5000, unit: "EGP/head" },
        },
        production: {
          dairy: { litersPerDay: 15, pricePerLiter: 18 },
          meat: { weightGainKgMonth: 30, pricePerKg: 180 },
          breeding: { calvesPerYear: 1 },
        },
        timeline: {
          maturityMonths: 18,
          lactationDays: 305,
          dryPeriodDays: 60,
        },
      },
      buffalo: {
        nameArabic: "جاموس",
        breeds: {
          dairy: ["Egyptian Buffalo", "Murrah"],
          meat: ["Egyptian Buffalo"],
        },
        costs: {
          purchasePrice: { min: 35000, max: 80000, unit: "EGP/head" },
          feedPerDay: { amount: 20, unit: "kg", costPerKg: 7 },
          veterinary: { monthly: 250, unit: "EGP/head" },
          housing: { initial: 6000, unit: "EGP/head" },
        },
        production: {
          dairy: { litersPerDay: 8, pricePerLiter: 25, fatContent: "7%" },
          meat: { weightGainKgMonth: 25, pricePerKg: 200 },
        },
        timeline: {
          maturityMonths: 24,
          lactationDays: 280,
        },
      },
      sheep: {
        nameArabic: "أغنام",
        breeds: {
          meat: ["Barki", "Rahmani", "Ossimi"],
          wool: ["Merino Cross", "Barki"],
        },
        costs: {
          purchasePrice: { min: 3000, max: 8000, unit: "EGP/head" },
          feedPerDay: { amount: 2, unit: "kg", costPerKg: 6 },
          veterinary: { monthly: 50, unit: "EGP/head" },
          housing: { initial: 500, unit: "EGP/head" },
        },
        production: {
          meat: { weightGainKgMonth: 5, pricePerKg: 200 },
          wool: { kgPerYear: 3, pricePerKg: 50 },
          lambs: { perYear: 1.5 },
        },
        timeline: {
          maturityMonths: 8,
          gestationDays: 150,
        },
      },
      goats: {
        nameArabic: "ماعز",
        breeds: {
          dairy: ["Zaraibi", "Damascus"],
          meat: ["Baladi", "Boer Cross"],
        },
        costs: {
          purchasePrice: { min: 2000, max: 6000, unit: "EGP/head" },
          feedPerDay: { amount: 1.5, unit: "kg", costPerKg: 5 },
          veterinary: { monthly: 40, unit: "EGP/head" },
          housing: { initial: 400, unit: "EGP/head" },
        },
        production: {
          dairy: { litersPerDay: 2, pricePerLiter: 20 },
          meat: { pricePerKg: 180 },
          kids: { perYear: 2 },
        },
        timeline: {
          maturityMonths: 6,
          gestationDays: 150,
        },
      },
      poultry: {
        nameArabic: "دواجن",
        types: {
          broiler: { cycleWeeks: 6, weightKg: 2.5 },
          layer: { eggsPerYear: 280, peakProductionWeeks: 72 },
          baladi: { eggsPerYear: 180, meatWeightKg: 1.8 },
        },
        costs: {
          chicks: { broiler: 12, layer: 25, unit: "EGP/chick" },
          feedPerKg: {
            broiler: 1.8,
            layer: 0.12,
            unit: "kg feed/kg meat or egg",
          },
          feedCost: 12,
          veterinary: { per1000: 500, unit: "EGP/cycle" },
          housing: { per1000: 15000, unit: "EGP" },
        },
        production: {
          broiler: { pricePerKg: 65 },
          eggs: { pricePerEgg: 3.5, pricePerTray: 105 },
        },
      },
      ducks: {
        nameArabic: "بط",
        types: {
          meat: { cycleWeeks: 10, weightKg: 3.5 },
          eggs: { eggsPerYear: 200 },
        },
        costs: {
          ducklings: 20,
          feedPerDay: 0.15,
          feedCost: 10,
        },
        production: {
          meat: { pricePerKg: 80 },
          eggs: { pricePerEgg: 5 },
        },
      },
      rabbits: {
        nameArabic: "أرانب",
        breeds: ["New Zealand", "California", "Baladi"],
        costs: {
          purchasePrice: { breeding: 300, meat: 150, unit: "EGP/head" },
          feedPerDay: { amount: 0.15, unit: "kg", costPerKg: 8 },
          housing: { perCage: 500 },
        },
        production: {
          meat: { weightKg: 2.5, pricePerKg: 100 },
          breeding: { littersPerYear: 6, kitsPerLitter: 8 },
        },
        timeline: {
          maturityWeeks: 12,
          gestationDays: 31,
        },
      },
      fish: {
        nameArabic: "أسماك",
        types: {
          tilapia: { cycleMonths: 6, weightKg: 0.5 },
          catfish: { cycleMonths: 8, weightKg: 1 },
          mullet: { cycleMonths: 12, weightKg: 0.3 },
        },
        costs: {
          fingerlings: { tilapia: 1, catfish: 2, unit: "EGP/fish" },
          feedConversion: 1.5,
          feedCost: 15,
          pondPer1000m2: 50000,
        },
        production: {
          tilapia: { pricePerKg: 50, yieldKgPer1000m2: 3000 },
          catfish: { pricePerKg: 45 },
        },
      },
      bees: {
        nameArabic: "نحل",
        costs: {
          hiveSetup: 2500,
          annualMaintenance: 500,
          equipment: 3000,
        },
        production: {
          honeyKgPerHive: 15,
          pricePerKg: 150,
          waxKgPerHive: 0.5,
          waxPrice: 200,
        },
      },
    };

    const animal = animalData[animalType] || animalData.cattle;
    const data = animal;

    // Calculate estimates for the given count
    let estimate = {
      animalType,
      nameArabic: data.nameArabic,
      count,
      purpose,
    };

    if (data.costs) {
      const purchaseMin = (data.costs.purchasePrice?.min || 0) * count;
      const purchaseMax = (data.costs.purchasePrice?.max || 0) * count;
      const dailyFeed =
        (data.costs.feedPerDay?.amount || 0) *
        count *
        (data.costs.feedPerDay?.costPerKg || data.costs.feedCost || 10);
      const monthlyFeed = dailyFeed * 30;
      const monthlyVet =
        (data.costs.veterinary?.monthly ||
          data.costs.veterinary?.per1000 / 1000 ||
          0) * count;
      const housing =
        (data.costs.housing?.initial || data.costs.housing?.perCage || 0) *
        count;

      estimate.costs = {
        initialInvestment: {
          purchaseMin,
          purchaseMax,
          housing,
          total: purchaseMin + housing,
        },
        monthly: {
          feed: monthlyFeed,
          veterinary: monthlyVet,
          total: monthlyFeed + monthlyVet,
        },
        annual: {
          feed: monthlyFeed * 12,
          veterinary: monthlyVet * 12,
          total: (monthlyFeed + monthlyVet) * 12,
        },
      };
    }

    if (data.production) {
      estimate.expectedRevenue = {};
      if (purpose === "dairy" && data.production.dairy) {
        const dailyLiters = (data.production.dairy.litersPerDay || 0) * count;
        estimate.expectedRevenue = {
          daily: dailyLiters * data.production.dairy.pricePerLiter,
          monthly: dailyLiters * data.production.dairy.pricePerLiter * 30,
          annual: dailyLiters * data.production.dairy.pricePerLiter * 305,
        };
      } else if (purpose === "meat" && data.production.meat) {
        estimate.expectedRevenue = {
          pricePerKg: data.production.meat.pricePerKg,
          estimatedWeight:
            (data.production.meat.weightGainKgMonth ||
              data.production.broiler?.pricePerKg) * count,
        };
      } else if (purpose === "eggs" && data.production.eggs) {
        estimate.expectedRevenue = {
          eggsPerDay:
            ((data.types?.layer?.eggsPerYear ||
              data.production?.eggsPerYear ||
              250) /
              365) *
            count,
          dailyRevenue:
            ((data.types?.layer?.eggsPerYear || 250) / 365) *
            count *
            (data.production.eggs?.pricePerEgg || 3.5),
        };
      }
    }

    estimate.timeline = data.timeline || {};
    estimate.recommendations = [];

    // Add recommendations based on Egyptian context
    if (animalType === "cattle" || animalType === "buffalo") {
      estimate.recommendations.push(
        "Consider registering with local veterinary office for subsidized vaccines",
        "Clover (berseem) is cheapest feed option in winter months",
        "Best selling time for meat is before Eid Al-Adha"
      );
    } else if (animalType === "poultry") {
      estimate.recommendations.push(
        "Summer requires extra ventilation investment",
        "Buy feed in bulk during harvest season for 20% savings",
        "Consider contract farming with major processors"
      );
    }

    return JSON.stringify(estimate);
  },
  {
    name: "get_animal_data",
    description:
      "Get comprehensive data about animal/livestock farming including costs, production, and recommendations for Egyptian farming context.",
    schema: z.object({
      animalType: z
        .enum([
          "cattle",
          "buffalo",
          "sheep",
          "goats",
          "poultry",
          "ducks",
          "rabbits",
          "fish",
          "bees",
        ])
        .describe("Type of animal"),
      purpose: z
        .enum(["meat", "dairy", "eggs", "wool", "honey", "mixed"])
        .describe("Purpose of raising the animal"),
      count: z.number().describe("Number of animals"),
    }),
  }
);

// ========================================
// CROP ROTATION RECOMMENDATION TOOL
// ========================================

export const getCropRotationTool = tool(
  async ({ previousCrops, soilType, governorate }) => {
    // Egyptian crop rotation recommendations
    const rotationRules = {
      // After legumes (fix nitrogen)
      berseem: ["wheat", "cotton", "maize", "rice"],
      fava_beans: ["cotton", "wheat", "maize"],
      lentils: ["wheat", "cotton"],

      // After cereals (need nitrogen)
      wheat: ["berseem", "cotton", "sunflower", "maize"],
      rice: ["berseem", "wheat", "fava_beans"],
      maize: ["wheat", "berseem", "fava_beans"],

      // After cotton (heavy feeder)
      cotton: ["berseem", "wheat", "fava_beans"],

      // After vegetables
      tomato: ["berseem", "wheat", "onion"],
      potato: ["wheat", "berseem", "maize"],
      onion: ["cotton", "maize", "berseem"],
    };

    const seasonalCrops = {
      winter: [
        "wheat",
        "berseem",
        "fava_beans",
        "lentils",
        "onion",
        "garlic",
        "flax",
        "sugar_beet",
      ],
      summer: [
        "cotton",
        "rice",
        "maize",
        "sunflower",
        "peanut",
        "sesame",
        "tomato",
      ],
      nili: ["maize", "tomato", "potato", "cucumber", "eggplant"],
    };

    const soilPreferences = {
      clay: ["rice", "cotton", "wheat", "berseem"],
      sandy: ["peanut", "watermelon", "potato", "carrot"],
      alluvial: ["wheat", "maize", "cotton", "vegetables"],
      loamy: ["most crops suitable"],
    };

    const lastCrop = previousCrops?.[0] || "wheat";
    const recommendations = rotationRules[lastCrop] || [
      "berseem",
      "wheat",
      "maize",
    ];

    // Current season (based on month)
    const month = new Date().getMonth();
    let currentSeason = "winter";
    if (month >= 3 && month <= 6) currentSeason = "summer";
    else if (month >= 7 && month <= 9) currentSeason = "nili";

    const seasonalOptions = seasonalCrops[currentSeason];
    const soilSuitable = soilPreferences[soilType] || soilPreferences.alluvial;

    // Find best matches
    const bestCrops = recommendations.filter(
      (crop) => seasonalOptions.includes(crop) || soilSuitable.includes(crop)
    );

    return JSON.stringify({
      previousCrops,
      currentSeason,
      soilType,
      governorate,
      recommendations: {
        bestNextCrops:
          bestCrops.length > 0 ? bestCrops : recommendations.slice(0, 3),
        reasoning: `After ${lastCrop}, soil needs ${
          lastCrop === "cotton" || lastCrop === "rice"
            ? "nitrogen-fixing crops like berseem"
            : "rotation to prevent disease"
        }`,
        seasonalOptions,
        soilSuitableCrops: soilSuitable,
      },
      rotationBenefits: [
        "Breaks pest and disease cycles",
        "Improves soil fertility",
        "Reduces need for fertilizers",
        "Maximizes yield over multiple seasons",
      ],
      warnings:
        previousCrops?.includes("rice") && previousCrops?.includes("rice")
          ? ["Avoid continuous rice - depletes water and increases salinity"]
          : [],
    });
  },
  {
    name: "get_crop_rotation",
    description:
      "Get crop rotation recommendations based on previous crops planted, soil type, and season.",
    schema: z.object({
      previousCrops: z
        .array(z.string())
        .describe(
          "List of crops planted in previous seasons (most recent first)"
        ),
      soilType: z
        .string()
        .optional()
        .describe("Soil type (clay, sandy, alluvial, loamy)"),
      governorate: z.string().optional().describe("Egyptian governorate"),
    }),
  }
);

// ========================================
// EXPORT ALL TOOLS
// ========================================

// ========================================
// DATABASE ACCESS TOOLS
// ========================================

export const getFarmProfileTool = tool(
  async ({ farmId }) => {
    try {
      if (!farmId) {
        return JSON.stringify({
          error: "No farm ID provided",
          note: "This tool requires a farm ID from the database",
        });
      }

      const farm = await Farm.findById(farmId).lean();

      if (!farm) {
        return JSON.stringify({
          error: "Farm not found",
          farmId,
          note: "The farm ID may be invalid or the farm was deleted",
        });
      }

      return JSON.stringify({
        success: true,
        farm: {
          id: farm._id,
          name: farm.name,
          location: farm.location,
          fieldSizeHectares: farm.fieldSizeHectares,
          soilType: farm.soilType,
          waterSource: farm.waterSource,
          irrigationType: farm.irrigationType,
          // Crop history for recommendations
          cropHistory: farm.cropHistory || [],
          // Animals on the farm
          animals: farm.animals || [],
          // Other relevant data
          ownershipType: farm.ownershipType,
          certifications: farm.certifications,
          notes: farm.notes,
        },
        recommendations: {
          useCropHistory:
            farm.cropHistory?.length > 0
              ? "Reference crop history for rotation planning"
              : "No crop history - recommend starting with diverse trial",
          hasAnimals:
            farm.animals?.length > 0
              ? `Farm has ${farm.animals.length} animal types - integrate into business plan`
              : "No animals registered",
        },
      });
    } catch (error) {
      return JSON.stringify({
        error: `Database error: ${error.message}`,
        farmId,
      });
    }
  },
  {
    name: "get_farm_profile",
    description:
      "Get complete farm profile from database including animals, crop history, soil data, and water sources. Use this for personalized recommendations based on farm history.",
    schema: z.object({
      farmId: z.string().describe("MongoDB ObjectId of the farm"),
    }),
  }
);

export const getCropHistoryTool = tool(
  async ({ farmId, years = 3 }) => {
    try {
      if (!farmId) {
        return JSON.stringify({
          error: "No farm ID provided",
          note: "This tool requires a farm ID",
        });
      }

      // Get completed harvest plans for this farm
      const harvestPlans = await HarvestPlan.find({
        farm: farmId,
        status: { $in: ["completed", "in_progress"] },
      })
        .sort({ createdAt: -1 })
        .limit(years * 4) // Assume up to 4 seasons per year
        .lean();

      // Get business plans for financial history
      const businessPlans = await BusinessPlan.find({
        farm: farmId,
        status: { $in: ["completed", "in_progress"] },
      })
        .sort({ createdAt: -1 })
        .limit(years)
        .lean();

      // Also get farm's embedded crop history
      const farm = await Farm.findById(farmId).select("cropHistory").lean();

      const analysis = {
        totalHarvestPlans: harvestPlans.length,
        totalBusinessPlans: businessPlans.length,
        crops: {},
      };

      // Analyze harvest plan outcomes
      harvestPlans.forEach((plan) => {
        const crop = plan.primaryCrop || "unknown";
        if (!analysis.crops[crop]) {
          analysis.crops[crop] = {
            timesPlanted: 0,
            avgYield: 0,
            avgProfit: 0,
            yields: [],
            profits: [],
            issues: [],
          };
        }
        analysis.crops[crop].timesPlanted++;
        if (plan.actualYield) {
          analysis.crops[crop].yields.push(plan.actualYield);
        }
        if (plan.actualCosts && plan.expectedRevenue) {
          analysis.crops[crop].profits.push(
            plan.expectedRevenue - plan.actualCosts
          );
        }
      });

      // Calculate averages
      Object.keys(analysis.crops).forEach((crop) => {
        const data = analysis.crops[crop];
        if (data.yields.length > 0) {
          data.avgYield =
            data.yields.reduce((a, b) => a + b, 0) / data.yields.length;
        }
        if (data.profits.length > 0) {
          data.avgProfit =
            data.profits.reduce((a, b) => a + b, 0) / data.profits.length;
        }
      });

      return JSON.stringify({
        success: true,
        farmId,
        yearsAnalyzed: years,
        harvestHistory: harvestPlans.map((p) => ({
          crop: p.primaryCrop,
          season: p.season,
          year: p.year,
          status: p.status,
          plannedYield: p.expectedYield,
          actualYield: p.actualYield,
          plannedCost: p.estimatedCosts?.total,
          actualCost: p.actualCosts,
        })),
        businessHistory: businessPlans.map((p) => ({
          duration: p.planDurationMonths,
          status: p.status,
          targetProfit: p.targetProfit,
          actualProfit: p.actualResults?.actualProfit,
          roi: p.roi,
        })),
        farmCropHistory: farm?.cropHistory || [],
        analysis,
        recommendations: {
          bestPerformingCrop:
            Object.entries(analysis.crops).sort(
              (a, b) => b[1].avgProfit - a[1].avgProfit
            )[0]?.[0] || "No data",
          rotationSuggestion:
            "Based on history, rotate with legumes after cereals",
        },
      });
    } catch (error) {
      return JSON.stringify({
        error: `Database error: ${error.message}`,
        farmId,
      });
    }
  },
  {
    name: "get_crop_history",
    description:
      "Get historical crop data for a farm including past yields, costs, revenues, and performance analysis. Use this to make recommendations based on what worked before.",
    schema: z.object({
      farmId: z.string().describe("MongoDB ObjectId of the farm"),
      years: z
        .number()
        .default(3)
        .describe("Number of years of history to retrieve"),
    }),
  }
);

export const getFarmAnimalsDetailsTool = tool(
  async ({ farmId, animalType }) => {
    try {
      if (!farmId) {
        return JSON.stringify({
          error: "No farm ID provided",
        });
      }

      const farm = await Farm.findById(farmId).select("animals name").lean();

      if (!farm) {
        return JSON.stringify({
          error: "Farm not found",
          farmId,
        });
      }

      let animals = farm.animals || [];

      if (animalType) {
        animals = animals.filter((a) => a.type === animalType);
      }

      // Enrich with management recommendations
      const recommendations = animals.map((animal) => {
        const recs = [];

        // Health recommendations
        if (animal.lastVetVisit) {
          const lastVisit = new Date(animal.lastVetVisit);
          const monthsSince = Math.floor(
            (new Date() - lastVisit) / (30 * 24 * 60 * 60 * 1000)
          );
          if (monthsSince > 3) {
            recs.push(
              `${animal.type}: Vet visit overdue (${monthsSince} months since last visit)`
            );
          }
        } else {
          recs.push(`${animal.type}: No vet visit recorded - schedule checkup`);
        }

        // Breeding recommendations based on season
        const month = new Date().getMonth();
        if (["cattle", "buffalo", "sheep", "goats"].includes(animal.type)) {
          if (month >= 8 && month <= 10) {
            recs.push(
              `${animal.type}: Good breeding season - consider mating for spring offspring`
            );
          }
        }

        return {
          animal: animal.type,
          recommendations: recs,
        };
      });

      // Market timing
      const marketTiming = {
        cattle: "Best prices before Eid Al-Adha (usually July-August)",
        sheep: "Peak demand during Eid Al-Adha and winter wedding season",
        goats: "Steady demand, slight increase during Ramadan",
        poultry: "Higher prices in winter months",
        fish: "Best prices during Lent season (spring)",
      };

      return JSON.stringify({
        success: true,
        farmName: farm.name,
        totalAnimalTypes: animals.length,
        animals: animals.map((a) => ({
          type: a.type,
          breed: a.breed,
          count: a.count,
          purpose: a.purpose,
          healthStatus: a.healthStatus,
          feedingSchedule: a.feedingSchedule,
          lastVetVisit: a.lastVetVisit,
          notes: a.notes,
        })),
        healthRecommendations: recommendations,
        marketTiming,
        integrationSuggestions: [
          "Use animal manure for crop fertilization (saves 30% on fertilizer)",
          "Plant berseem/clover as feed crop in winter rotation",
          "Consider fish-vegetable aquaponics for water efficiency",
        ],
      });
    } catch (error) {
      return JSON.stringify({
        error: `Database error: ${error.message}`,
        farmId,
      });
    }
  },
  {
    name: "get_farm_animals_details",
    description:
      "Get detailed information about animals on a specific farm from the database, including health status, feeding schedules, and management recommendations.",
    schema: z.object({
      farmId: z.string().describe("MongoDB ObjectId of the farm"),
      animalType: z
        .string()
        .optional()
        .describe("Filter by specific animal type"),
    }),
  }
);

export const allTools = [
  getWeatherTool,
  getMarketPricesTool,
  getForexRateTool,
  getOilPriceTool,
  getMarketNewsTool,
  getFaoDataTool,
  analyzeSoilTool,
  calculateWaterNeedsTool,
  estimateCostsTool,
  getAnimalDataTool,
  getCropRotationTool,
  // Database access tools
  getFarmProfileTool,
  getCropHistoryTool,
  getFarmAnimalsDetailsTool,
];

export default {
  getWeatherTool,
  getMarketPricesTool,
  getForexRateTool,
  getOilPriceTool,
  getMarketNewsTool,
  getFaoDataTool,
  analyzeSoilTool,
  calculateWaterNeedsTool,
  estimateCostsTool,
  getAnimalDataTool,
  getCropRotationTool,
  getFarmProfileTool,
  getCropHistoryTool,
  getFarmAnimalsDetailsTool,
  allTools,
};
