import axios from "axios";

// FAOSTAT API - Official FAO agricultural data
// Used by AI services to analyze: fertilizer, crop production, land use, water, prices, emissions, trade, soil

const FAOSTAT_BASE_URL = "https://fenixservices.fao.org/faostat/api/v1/en";

// Common item codes (crop/commodity indicators)
export const FAO_ITEMS = {
  WHEAT: 56,
  MAIZE: 27,
  RICE: 71,
  COTTON: 8,
  SUGARCANE: 156,
  POTATOES: 116,
  TOMATOES: 172,
};

// Common area codes
export const FAO_AREAS = {
  EGYPT: 59,
  WORLD: 1,
  AFRICA: 5002,
};

// Datasets
export const FAO_DATASETS = {
  PRODUCTION: "QC", // Crop production
  FERTILIZER: "RFB", // Fertilizer use
  LAND_USE: "EL", // Land use
  WATER: "EW", // Water use
  PRICES: "PP", // Food prices
  EMISSIONS: "ER", // Agricultural emissions
  TRADE: "TM", // Trade matrix
};

/**
 * Fetch crop production data from FAOSTAT
 * @param {number} itemCode - FAO item code (e.g., 56 for wheat)
 * @param {number} areaCode - FAO area code (e.g., 59 for Egypt)
 * @param {number} yearRange - years back (default 10)
 */
export const getCropProduction = async (
  itemCode,
  areaCode = FAO_AREAS.EGYPT,
  yearRange = 10
) => {
  try {
    const url = `${FAOSTAT_BASE_URL}/${FAO_DATASETS.PRODUCTION}`;
    const params = {
      item_code: itemCode,
      area_code: areaCode,
      sort_by: "Year",
      sort_direction: "desc",
    };

    const res = await axios.get(url, { params, timeout: 10000 });
    const data = res.data.data || [];

    // Return last N years
    return data.slice(0, yearRange).map((record) => ({
      year: record.Year,
      production: record.Value,
      unit: record.Unit,
      flag: record.Flag,
    }));
  } catch (err) {
    console.warn(`FAOSTAT crop production error: ${err.message}`);
    return [];
  }
};

/**
 * Fetch fertilizer use data
 */
export const getFertilizerUse = async (
  itemCode,
  areaCode = FAO_AREAS.EGYPT,
  yearRange = 10
) => {
  try {
    const url = `${FAOSTAT_BASE_URL}/${FAO_DATASETS.FERTILIZER}`;
    const params = {
      item_code: itemCode,
      area_code: areaCode,
    };

    const res = await axios.get(url, { params, timeout: 10000 });
    const data = res.data.data || [];

    return data.slice(0, yearRange).map((record) => ({
      year: record.Year,
      fertilizer: record.Value,
      element: record.Element,
      unit: record.Unit,
    }));
  } catch (err) {
    console.warn(`FAOSTAT fertilizer error: ${err.message}`);
    return [];
  }
};

/**
 * Fetch land use data (cultivated area, harvested area, etc.)
 */
export const getLandUse = async (
  itemCode,
  areaCode = FAO_AREAS.EGYPT,
  yearRange = 10
) => {
  try {
    const url = `${FAOSTAT_BASE_URL}/${FAO_DATASETS.LAND_USE}`;
    const params = {
      item_code: itemCode,
      area_code: areaCode,
    };

    const res = await axios.get(url, { params, timeout: 10000 });
    const data = res.data.data || [];

    return data.slice(0, yearRange).map((record) => ({
      year: record.Year,
      area: record.Value,
      element: record.Element,
      unit: record.Unit,
    }));
  } catch (err) {
    console.warn(`FAOSTAT land use error: ${err.message}`);
    return [];
  }
};

/**
 * Fetch food prices (for market analysis)
 */
export const getFoodPrices = async (
  itemCode,
  areaCode = FAO_AREAS.EGYPT,
  yearRange = 10
) => {
  try {
    const url = `${FAOSTAT_BASE_URL}/${FAO_DATASETS.PRICES}`;
    const params = {
      item_code: itemCode,
      area_code: areaCode,
    };

    const res = await axios.get(url, { params, timeout: 10000 });
    const data = res.data.data || [];

    return data.slice(0, yearRange).map((record) => ({
      year: record.Year,
      price: record.Value,
      currency: record.Unit,
      element: record.Element,
    }));
  } catch (err) {
    console.warn(`FAOSTAT prices error: ${err.message}`);
    return [];
  }
};

/**
 * Fetch agricultural emissions (for sustainability analysis)
 */
export const getEmissions = async (
  itemCode,
  areaCode = FAO_AREAS.EGYPT,
  yearRange = 10
) => {
  try {
    const url = `${FAOSTAT_BASE_URL}/${FAO_DATASETS.EMISSIONS}`;
    const params = {
      item_code: itemCode,
      area_code: areaCode,
    };

    const res = await axios.get(url, { params, timeout: 10000 });
    const data = res.data.data || [];

    return data.slice(0, yearRange).map((record) => ({
      year: record.Year,
      emission: record.Value,
      element: record.Element,
      unit: record.Unit,
    }));
  } catch (err) {
    console.warn(`FAOSTAT emissions error: ${err.message}`);
    return [];
  }
};

/**
 * Aggregate FAO data for AI analysis
 * Combines production, fertilizer, land use, and prices
 */
export const aggregateAgriculturalData = async (
  cropCode,
  areaCode = FAO_AREAS.EGYPT
) => {
  try {
    const [production, fertilizer, landUse, prices] = await Promise.all([
      getCropProduction(cropCode, areaCode, 5),
      getFertilizerUse(cropCode, areaCode, 5),
      getLandUse(cropCode, areaCode, 5),
      getFoodPrices(cropCode, areaCode, 5),
    ]);

    return {
      crop: cropCode,
      area: areaCode,
      production,
      fertilizer,
      landUse,
      prices,
      timestamp: new Date(),
      source: "FAOSTAT",
    };
  } catch (err) {
    console.error(`Aggregation error: ${err.message}`);
    return null;
  }
};

export default {
  getCropProduction,
  getFertilizerUse,
  getLandUse,
  getFoodPrices,
  getEmissions,
  aggregateAgriculturalData,
  FAO_ITEMS,
  FAO_AREAS,
  FAO_DATASETS,
};
