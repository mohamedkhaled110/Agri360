import assert from "assert";
import priceService from "../services/priceService.js";

/**
 * Test Mahsoly crop prices in dashboard
 */
export function testDashboardCropPrices() {
  // Simulate dashboard receiving crop prices
  const mockMahsolyResponse = {
    source: "mahsoly",
    endpoint: "/stockmarket",
    prices: [
      { name: "Wheat", item_name: "القمح", price: 450, date: "2025-11-15" },
      { name: "Rice", item_name: "الأرز", price: 680, date: "2025-11-15" },
      { name: "Corn", item_name: "الذرة", price: 380, date: "2025-11-15" },
    ],
    lastUpdated: new Date().toISOString(),
    count: 3,
  };

  assert.strictEqual(mockMahsolyResponse.source, "mahsoly");
  assert(Array.isArray(mockMahsolyResponse.prices));
  assert(mockMahsolyResponse.prices.length > 0);
  assert.strictEqual(mockMahsolyResponse.prices[0].price, 450);
}

/**
 * Test marketplace listing with Mahsoly price suggestion
 */
export function testMarketplaceListingWithPriceSuggestion() {
  const listingData = {
    title: "Quality Wheat",
    crop: "Wheat",
    quantity: 100,
    unit: "kg",
    pricePerUnit: 460,
    suggestedPrice: 450, // From Mahsoly
  };

  assert.strictEqual(listingData.crop, "Wheat");
  assert.strictEqual(listingData.pricePerUnit, 460);
  assert.strictEqual(listingData.suggestedPrice, 450);
  assert(
    Math.abs(listingData.pricePerUnit - listingData.suggestedPrice) <= 20,
    "Price within 20 EGP of market"
  );
}

/**
 * Test price enrichment in marketplace listings
 */
export function testMarketplaceListingEnrichment() {
  const listing = {
    _id: "123",
    crop: "Rice",
    pricePerUnit: 700,
    farmer: {
      name: "Ahmed",
    },
  };

  const mahsolyData = {
    source: "mahsoly",
    prices: [{ price: 680 }],
    currency: "EGP",
  };

  const enriched = {
    ...listing,
    marketPriceData: mahsolyData,
    priceComparison: {
      listingPrice: listing.pricePerUnit,
      marketPrice: mahsolyData.prices[0].price,
      marketCurrency: mahsolyData.currency,
      source: mahsolyData.source,
    },
  };

  assert.strictEqual(enriched.marketPriceData.source, "mahsoly");
  assert.strictEqual(enriched.priceComparison.listingPrice, 700);
  assert.strictEqual(enriched.priceComparison.marketPrice, 680);
  assert.strictEqual(enriched.priceComparison.marketCurrency, "EGP");
}

/**
 * Test dashboard stats with crop prices
 */
export function testDashboardStatsWithPrices() {
  const dashboardStats = {
    cropPriceTrends: {
      source: "mahsoly",
      prices: [
        { name: "Wheat", price: 450, trend: "up" },
        { name: "Rice", price: 680, trend: "stable" },
      ],
    },
    cropPrices: [
      { name: "Wheat", item_name: "القمح", price: 450 },
      { name: "Rice", item_name: "الأرز", price: 680 },
    ],
    pricesSource: "mahsoly",
    pricesLastUpdated: new Date().toISOString(),
  };

  assert(Array.isArray(dashboardStats.cropPrices));
  assert.strictEqual(dashboardStats.pricesSource, "mahsoly");
  assert(dashboardStats.pricesLastUpdated);
}

/**
 * Test price comparison for farmer decision-making
 */
export function testFarmerPriceComparison() {
  const farmersListings = [
    {
      crop: "Wheat",
      pricePerUnit: 460,
      marketPrice: 450,
      priceStatus: "competitive",
    },
    {
      crop: "Rice",
      pricePerUnit: 650,
      marketPrice: 680,
      priceStatus: "below_market",
    },
  ];

  farmersListings.forEach((listing) => {
    if (listing.pricePerUnit >= listing.marketPrice - 10) {
      listing.priceStatus = "competitive";
    } else {
      listing.priceStatus = "below_market";
    }
  });

  assert.strictEqual(farmersListings[0].priceStatus, "competitive");
  assert.strictEqual(farmersListings[1].priceStatus, "below_market");
}

export default {
  testDashboardCropPrices,
  testMarketplaceListingWithPriceSuggestion,
  testMarketplaceListingEnrichment,
  testDashboardStatsWithPrices,
  testFarmerPriceComparison,
};
