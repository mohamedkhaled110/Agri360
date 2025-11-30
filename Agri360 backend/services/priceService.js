import axios from "axios";
import PriceHistory from "../models/PriceHistory.js";

const MAHSOLY_BASE_URL = process.env.MAHSOLY_API || "https://api.mahsoly.com";
const MAHSOLY_USERID = process.env.MAHSOLY_USERID || 0;

/**
 * Fetch wholesale market prices from Mahsoly /stockmarket endpoint
 * Daily update frequency
 */
export const getStockMarketPrices = async () => {
  try {
    const endpoint = `${MAHSOLY_BASE_URL}/stockmarket`;
    const res = await axios.get(endpoint, {
      timeout: 10000,
    });

    // Parse response and normalize
    const prices = res.data || [];
    const normalized = {
      source: "mahsoly",
      endpoint: "/stockmarket",
      prices: prices,
      lastUpdated: new Date().toISOString(),
      count: prices.length || 0,
    };

    return normalized;
  } catch (err) {
    console.warn(`Mahsoly /stockmarket error: ${err.message}`);
    return {
      source: "mahsoly-mock",
      endpoint: "/stockmarket",
      prices: [],
      error: err.message,
    };
  }
};

/**
 * Fetch crop/item data from Mahsoly /item/all endpoint
 * Returns available items (محاصيل)
 */
export const getMahsolyItems = async (
  categoryName = "",
  itemName = "",
  size = 100
) => {
  try {
    const endpoint = `${MAHSOLY_BASE_URL}/item/all`;
    const res = await axios.post(
      endpoint,
      {
        categoryName,
        name: itemName,
        size,
        userid: MAHSOLY_USERID,
      },
      {
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
        timeout: 10000,
      }
    );

    const items = res.data || [];
    return {
      source: "mahsoly",
      endpoint: "/item/all",
      items: items,
      count: items.length || 0,
      filters: { categoryName, itemName, size },
    };
  } catch (err) {
    console.warn(`Mahsoly /item/all error: ${err.message}`);
    return {
      source: "mahsoly-mock",
      endpoint: "/item/all",
      items: [],
      error: err.message,
    };
  }
};

/**
 * Fetch farm/land data from Mahsoly /farm/all endpoint
 * Returns available farms (أراضي)
 */
export const getMahsolyFarms = async (
  typeName = "",
  target = "",
  size = 100
) => {
  try {
    const endpoint = `${MAHSOLY_BASE_URL}/farm/all`;
    const res = await axios.post(
      endpoint,
      {
        size,
        userid: MAHSOLY_USERID,
        target,
        typeName,
      },
      {
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
        timeout: 10000,
      }
    );

    const farms = res.data || [];
    return {
      source: "mahsoly",
      endpoint: "/farm/all",
      farms: farms,
      count: farms.length || 0,
      filters: { typeName, target, size },
    };
  } catch (err) {
    console.warn(`Mahsoly /farm/all error: ${err.message}`);
    return {
      source: "mahsoly-mock",
      endpoint: "/farm/all",
      farms: [],
      error: err.message,
    };
  }
};

/**
 * Fetch current crop prices (legacy method, now uses /stockmarket)
 */
export const fetchMahsolyPrices = async (crop) => {
  try {
    // Try /stockmarket endpoint first
    const marketData = await getStockMarketPrices();

    if (marketData.prices && marketData.prices.length > 0) {
      // Find matching crop in market data
      const matching = marketData.prices.filter(
        (p) =>
          p.name?.toLowerCase().includes(crop?.toLowerCase()) ||
          p.item_name?.toLowerCase().includes(crop?.toLowerCase())
      );

      if (matching.length > 0) {
        return {
          crop,
          prices: matching,
          source: "mahsoly",
          currency: "EGP",
        };
      }
    }

    // Fallback: return mock data
    return {
      crop,
      price: 100,
      currency: "EGP",
      source: "mock",
    };
  } catch (err) {
    console.warn(`fetchMahsolyPrices error: ${err.message}`);
    return {
      crop,
      price: 100,
      currency: "EGP",
      source: "mock",
      error: err.message,
    };
  }
};

/**
 * Record price history in database
 */
export const recordPrice = async ({
  source = "mahsoly",
  crop,
  price,
  currency = "EGP",
  date = new Date(),
}) => {
  try {
    const entry = await PriceHistory.create({
      source,
      crop,
      price,
      currency,
      date,
    });
    return entry;
  } catch (err) {
    console.error(`recordPrice error: ${err.message}`);
    return null;
  }
};

/**
 * Aggregate all Mahsoly data for AI context
 */
export const aggregateMahsolyData = async (
  crop = "wheat",
  itemCategory = ""
) => {
  try {
    const [marketPrices, items, farms] = await Promise.all([
      getStockMarketPrices(),
      getMahsolyItems(itemCategory),
      getMahsolyFarms(),
    ]);

    return {
      source: "mahsoly",
      timestamp: new Date().toISOString(),
      marketData: marketPrices,
      itemsData: items,
      farmsData: farms,
    };
  } catch (err) {
    console.warn(`aggregateMahsolyData error: ${err.message}`);
    return {
      source: "mahsoly-mock",
      timestamp: new Date().toISOString(),
      error: err.message,
    };
  }
};

export default {
  getStockMarketPrices,
  getMahsolyItems,
  getMahsolyFarms,
  fetchMahsolyPrices,
  recordPrice,
  aggregateMahsolyData,
};
