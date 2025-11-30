# 🏪 Mahsoly API Integration - Complete Documentation

**Date**: November 15, 2025  
**Status**: ✅ FULLY INTEGRATED  
**Base URL**: https://api.mahsoly.com

---

## 📋 API Endpoints Integrated

### 1. Stock Market Prices (`/stockmarket`) 📊

**Method**: GET  
**Endpoint**: `/stockmarket`  
**Purpose**: Fetch wholesale market prices (daily update)

**Response Fields**:

- `name`: Crop/item name
- `price`: Current price (EGP)
- `quantity`: Available quantity
- `date`: Update date
- `unit`: Unit of measurement
- `category`: Item category

**Service Function**:

```javascript
priceService.getStockMarketPrices();
```

**Example Response**:

```json
{
  "source": "mahsoly",
  "endpoint": "/stockmarket",
  "prices": [
    {
      "name": "قمح (Wheat)",
      "price": 450,
      "quantity": 1000,
      "unit": "ardeb",
      "date": "2025-11-15"
    },
    {
      "name": "ذرة (Maize)",
      "price": 380,
      "quantity": 800,
      "unit": "ardeb",
      "date": "2025-11-15"
    }
  ],
  "lastUpdated": "2025-11-15T10:30:00Z",
  "count": 2
}
```

---

### 2. Crop Items (`/item/all`) 🌾

**Method**: POST  
**Endpoint**: `/item/all`  
**Purpose**: Fetch available crop items and categories

**Request Body**:

```json
{
  "categoryName": "", // Optional: filter by category
  "name": "", // Optional: search by crop name
  "size": 100, // Page size (default 100)
  "userid": 0 // User ID
}
```

**Response Fields**:

- `item_id`: Unique item ID
- `name`: Item name (Arabic/English)
- `category`: Category name
- `unit`: Standard unit
- `description`: Item description

**Service Function**:

```javascript
priceService.getMahsolyItems(categoryName, itemName, size);
```

**Example Call**:

```javascript
const items = await priceService.getMahsolyItems("محاصيل", "قمح", 50);
```

---

### 3. Farms Data (`/farm/all`) 🚜

**Method**: POST  
**Endpoint**: `/farm/all`  
**Purpose**: Fetch available farm types and land information

**Request Body**:

```json
{
  "size": 100, // Page size
  "userid": 0, // User ID
  "target": "", // Optional: target/objective
  "typeName": "" // Optional: farm type filter
}
```

**Response Fields**:

- `farm_id`: Unique farm ID
- `type_name`: Farm type (irrigated, rain-fed, etc.)
- `area`: Farm area (feddan)
- `location`: Farm location
- `owner`: Farm owner info

**Service Function**:

```javascript
priceService.getMahsolyFarms(typeName, target, size);
```

**Example Call**:

```javascript
const farms = await priceService.getMahsolyFarms("أراضي مروية", "", 50);
```

---

## 🔗 Integration Points

### 1. Business Plan Service

**File**: `services/businessPlan.service.js`

```javascript
// Gathers Mahsoly data as part of AI context
const mahsolyData = await priceService.aggregateMahsolyData(crop);

// Includes in AI context
const aiContext = {
  marketData: {
    mahsoly: mahsolyData, // ← All three endpoints aggregated
    currency: fx,
    oilPrices: oil,
  },
};
```

**Data Provided to AI**:

- Current market prices (stock market)
- Available crop items
- Farm types and availability
- Historical trends
- Market sentiment

---

### 2. Dashboard Analytics

**File**: `controllers/dashboard.controller.js`

```javascript
// Fetches Mahsoly data for dashboard
const mahsolyData = await priceService.aggregateMahsolyData(crop);

// Stores in DashboardStats
const stats = await DashboardStats.create({
  cropPriceTrends: mahsolyData, // ← Mahsoly data
  currencyImpact: fx,
  newsImpact: news,
  weatherImpact: weather,
  oilImpact: oil,
  faoDataForAI: faoData,
  riskScore,
  alerts,
});
```

---

### 3. AI Prompts

**Files**:

- `ai/prompts/business_plan.txt` (enhanced version)
- `ai/prompts/business_plan_enhanced.txt` (new detailed version)

**Prompt Guidance**:

```
Use Mahsoly /stockmarket data for current market prices (EGP)
Cross-reference FAOSTAT historical yields to validate profit expectations
Reference current Mahsoly market prices in forecasts
```

---

## 📊 Service Functions

### `getStockMarketPrices()`

```javascript
// Get current wholesale market prices
const prices = await priceService.getStockMarketPrices();
// Returns: { source, endpoint, prices[], lastUpdated, count }
```

### `getMahsolyItems(categoryName, itemName, size)`

```javascript
// Get available crop items
const items = await priceService.getMahsolyItems("", "wheat", 100);
// Returns: { source, endpoint, items[], count, filters }
```

### `getMahsolyFarms(typeName, target, size)`

```javascript
// Get available farm types
const farms = await priceService.getMahsolyFarms("", "", 100);
// Returns: { source, endpoint, farms[], count, filters }
```

### `aggregateMahsolyData(crop, itemCategory)`

```javascript
// Aggregate all Mahsoly data in one call (parallel)
const allData = await priceService.aggregateMahsolyData("wheat");
// Returns: {
//   source: "mahsoly",
//   timestamp,
//   marketData: {...},      // from /stockmarket
//   itemsData: {...},       // from /item/all
//   farmsData: {...}        // from /farm/all
// }
```

### `fetchMahsolyPrices(crop)` (Legacy)

```javascript
// Fetch prices for specific crop (uses aggregateMahsolyData internally)
const prices = await priceService.fetchMahsolyPrices("wheat");
// Returns: { crop, prices[], source, currency }
```

### `recordPrice({ source, crop, price, currency, date })`

```javascript
// Save price history to database
const record = await priceService.recordPrice({
  source: "mahsoly",
  crop: "wheat",
  price: 450,
  currency: "EGP",
});
```

---

## 🔐 Environment Configuration

**Updated `.env` file**:

```bash
# MAHSOLY (Egypt crop prices, items, farms)
MAHSOLY_API=https://api.mahsoly.com
MAHSOLY_USERID=0
MAHSOLY_KEY=
```

**Notes**:

- `MAHSOLY_API`: Base URL (updated to root endpoint)
- `MAHSOLY_USERID`: User ID for API calls (default: 0)
- `MAHSOLY_KEY`: Optional API key (if required by Mahsoly)

---

## 🔄 Data Flow

### Creating a Business Plan

```
1. POST /api/business
   ↓
2. businessPlan.service.createBusinessPlan()
   ↓
3. priceService.aggregateMahsolyData(crop)
   ├─ Calls /stockmarket (GET)
   ├─ Calls /item/all (POST)
   └─ Calls /farm/all (POST)
   ↓
4. Aggregate with FAO, weather, currency, oil data
   ↓
5. Construct AI context with Mahsoly data
   ↓
6. Call aiService.generateBusinessPlan()
   (DeepSeek reads business_plan.txt + context)
   ↓
7. AI analyzes market prices, items, farms, sentiment
   ↓
8. Store BusinessPlan with AI recommendations
```

---

## 📈 AI Context Example

**What the AI receives**:

```javascript
{
  farm: { location, soil, fieldSize, ... },
  crop: "wheat",
  marketData: {
    mahsoly: {
      source: "mahsoly",
      timestamp: "2025-11-15T10:30:00Z",
      marketData: {
        prices: [
          { name: "قمح", price: 450, unit: "ardeb" },
          { name: "ذرة", price: 380, unit: "ardeb" }
        ]
      },
      itemsData: {
        items: [
          { name: "قمح مصري", category: "محاصيل", unit: "ardeb" }
        ]
      },
      farmsData: {
        farms: [
          { type: "أراضي مروية", area: 5 }
        ]
      }
    },
    currency: { rate: 30.5, base: "USD", target: "EGP" },
    oilPrices: { brent: 75, wti: 72, usd: 1 }
  },
  weatherData: { forecast: [...] },
  faoData: { production: [...], fertilizer: [...] },
  farmData: { soil: {...}, water: {...} }
}
```

**AI Uses This To**:

- 📊 Calculate profit margins based on current Mahsoly prices
- 🌾 Recommend crop based on available items and farms
- 💰 Forecast revenue using market trends
- 📅 Plan timing based on market seasonality
- ⚖️ Adjust costs based on oil prices

---

## ✅ Testing

### Test Mahsoly Integration

```javascript
// Test /stockmarket endpoint
const prices = await priceService.getStockMarketPrices();
console.log(prices);

// Test /item/all endpoint
const items = await priceService.getMahsolyItems("", "wheat", 10);
console.log(items);

// Test /farm/all endpoint
const farms = await priceService.getMahsolyFarms("", "", 10);
console.log(farms);

// Test aggregation
const allData = await priceService.aggregateMahsolyData("wheat");
console.log(allData);
```

### Test Business Plan with Mahsoly

```bash
curl -X POST http://localhost:5000/api/business \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "farm": {
      "_id": "farm_123",
      "location": { "lat": 30.0444, "lon": 31.2357 },
      "fieldSizeHectares": 2,
      "soil": { "ph": 7.2 }
    },
    "crop": "wheat",
    "cropCode": 56,
    "investmentCost": 5000
  }'
```

**Expected Response**:

```json
{
  "businessPlan": {
    "costEstimate": {...},
    "fertilizer": {...},
    "waterPlan": {...},
    "priceForecast": {
      "unit_price_at_harvest": 450,
      "currency": "EGP",
      "confidence": "high",
      "reasoning": "based on Mahsoly current prices (450 EGP/ardeb) and FAOSTAT trends"
    },
    "profitEstimate": {...},
    "timeline": {...},
    "aiNotes": "Mahsoly data integrated for market-based forecasting..."
  }
}
```

---

## 🚨 Error Handling

All Mahsoly functions have built-in error handling:

```javascript
// If endpoint fails, returns mock data
{
  source: "mahsoly-mock",
  endpoint: "/stockmarket",
  prices: [],
  error: "error message"
}
```

**Fallback Behavior**:

1. Try Mahsoly API
2. If fails → Return mock data
3. If mock → AI still generates plan with dummy prices
4. User sees recommendations with note about data unavailability

---

## 🔍 Verification Checklist

- [x] All 3 Mahsoly endpoints implemented
- [x] Service functions created (getStockMarketPrices, getMahsolyItems, getMahsolyFarms)
- [x] Aggregation function implemented (aggregateMahsolyData)
- [x] Integration with businessPlan.service.js
- [x] Integration with dashboard.controller.js
- [x] AI prompts reference Mahsoly data
- [x] Environment variables configured
- [x] Error handling with fallbacks
- [x] Database recording (recordPrice)
- [x] Legacy function updated (fetchMahsolyPrices)

---

## 📚 Files Updated

1. **services/priceService.js**

   - Added `getStockMarketPrices()`
   - Added `getMahsolyItems()`
   - Added `getMahsolyFarms()`
   - Added `aggregateMahsolyData()`
   - Updated `fetchMahsolyPrices()`
   - Added `recordPrice()`

2. **services/businessPlan.service.js**

   - Updated to use `aggregateMahsolyData()`
   - Enhanced AI context with Mahsoly data

3. **controllers/dashboard.controller.js**

   - Updated to use `aggregateMahsolyData()`
   - Store Mahsoly data in DashboardStats

4. **.env**

   - Updated MAHSOLY_API to root URL
   - Added MAHSOLY_USERID
   - Kept MAHSOLY_KEY for future use

5. **ai/prompts/business_plan_enhanced.txt** (NEW)
   - Detailed Mahsoly endpoint documentation
   - Enhanced AI instructions for market-based forecasting

---

## 🎯 Next Steps

1. ✅ Test all endpoints with actual Mahsoly API
2. ✅ Monitor response times and optimize if needed
3. ⚠️ Confirm if MAHSOLY_KEY is required
4. ⚠️ Add caching for /stockmarket (daily updates only)
5. ⚠️ Add webhook for real-time price updates
6. ⚠️ Expand to other Egyptian agricultural APIs

---

## 📊 Summary

**Mahsoly Integration Status**: 🟢 **PRODUCTION READY**

- ✅ 3 endpoints integrated
- ✅ Full aggregation capability
- ✅ AI-powered business plans use market data
- ✅ Dashboard shows current market trends
- ✅ Error handling with fallbacks
- ✅ Database recording capability
- ✅ Environment configured

---

**Last Updated**: November 15, 2025  
**Integration Status**: ✅ COMPLETE
