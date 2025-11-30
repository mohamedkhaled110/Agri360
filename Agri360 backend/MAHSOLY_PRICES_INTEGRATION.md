# Agri360 - Mahsoly Crop Prices Integration

## Overview

Farmers now have real-time access to crop market prices from **Mahsoly** directly in:

- 📊 **Dashboard** - View current market prices for all crops
- 🏪 **Marketplace** - See price suggestions when listing and compare listings against market prices

## Features

### 1. Dashboard Crop Prices

When farmers access the dashboard, they see:

- **Current market prices** from Mahsoly for all major crops
- **Price source** and **last update time**
- Full price data including crop name, current price, and date

**API Endpoint:**

```
GET /dashboard/stats
```

**Response includes:**

```json
{
  "stats": {
    "cropPriceTrends": { ... },
    "cropPrices": [
      {
        "name": "Wheat",
        "item_name": "القمح",
        "price": 450,
        "date": "2025-11-15"
      },
      {
        "name": "Rice",
        "item_name": "الأرز",
        "price": 680,
        "date": "2025-11-15"
      }
    ],
    "pricesSource": "mahsoly",
    "pricesLastUpdated": "2025-11-15T10:30:00.000Z"
  }
}
```

### 2. Marketplace Listing with Price Suggestion

When creating a market listing, the system automatically:

1. Fetches the current market price from Mahsoly for that crop
2. Suggests the market price to the farmer
3. Stores the suggested price with the listing

**API Endpoint:**

```
POST /marketplace/listings
Content-Type: application/json

{
  "title": "Quality Wheat",
  "crop": "Wheat",
  "quantity": 500,
  "unit": "kg",
  "pricePerUnit": 450,
  "location": "Dakahlia, Egypt"
}
```

**Response includes:**

```json
{
  "listing": {
    "_id": "...",
    "title": "Quality Wheat",
    "crop": "Wheat",
    "quantity": 500,
    "unit": "kg",
    "pricePerUnit": 450,
    "suggestedPrice": 450,
    "location": "Dakahlia, Egypt",
    "status": "active",
    "createdAt": "2025-11-15T10:30:00.000Z"
  },
  "marketPriceSuggestion": {
    "price": 450,
    "currency": "EGP",
    "source": "mahsoly"
  }
}
```

### 3. Marketplace Listings with Price Comparison

When browsing marketplace listings, farmers see:

- **List of active listings** from other farmers
- **Current market price** for each crop type
- **Price comparison** to help make informed decisions

**API Endpoint:**

```
GET /marketplace/listings
```

**Response includes:**

```json
{
  "listings": [
    {
      "_id": "...",
      "title": "Premium Wheat",
      "crop": "Wheat",
      "quantity": 500,
      "pricePerUnit": 460,
      "suggestedPrice": 450,
      "farmer": {
        "_id": "...",
        "name": "Ahmed Hassan",
        "email": "ahmed@farm.com"
      },
      "marketPriceData": {
        "source": "mahsoly",
        "prices": [
          {
            "name": "Wheat",
            "price": 450
          }
        ],
        "currency": "EGP"
      },
      "priceComparison": {
        "listingPrice": 460,
        "marketPrice": 450,
        "marketCurrency": "EGP",
        "source": "mahsoly"
      }
    }
  ]
}
```

## Language Support

All crop price features support multiple languages:

### English

```
GET /marketplace/listings
Accept-Language: en
```

### Arabic (Egyptian - Default)

```
GET /marketplace/listings?lang=ar
Accept-Language: ar-EG
```

### Arabic (Saudi)

```
GET /marketplace/listings?lang=ar-SA
Accept-Language: ar-SA
```

## Benefits for Farmers

1. **Fair Pricing** - Know market prices before listing produce
2. **Competitive Analysis** - Compare listing prices with market rates
3. **Informed Decisions** - Make better decisions about what to grow and at what price
4. **Market Transparency** - Real-time access to wholesale market data
5. **Multilingual Support** - Access prices in English or Arabic

## Data Source

**Mahsoly API Integration:**

- Endpoint: `/stockmarket` - Current wholesale market prices
- Update Frequency: Daily
- Currency: EGP (Egyptian Pound)
- Coverage: Major crops (Wheat, Rice, Corn, Cotton, etc.)

## Technical Implementation

### Files Modified:

1. **controllers/dashboard.controller.js**

   - Enhanced `getStats()` to include Mahsoly crop prices

2. **controllers/marketplace.controller.js**

   - Enhanced `createListing()` to fetch and suggest market prices
   - Enhanced `listListings()` to enrich listings with market price comparisons

3. **models/MarketListing.js**

   - Added `suggestedPrice` field to store market price suggestion

4. **services/priceService.js**
   - Already includes `getStockMarketPrices()` and `fetchMahsolyPrices()` methods
   - Used by controllers to fetch real-time market data

### Price Enrichment Flow:

```
Dashboard Request
    ↓
Fetch Dashboard Stats
    ↓
Call priceService.getStockMarketPrices()
    ↓
Add cropPrices array to response
    ↓
Return dashboard with market prices

---

Create Listing Request
    ↓
Extract crop name from request
    ↓
Call priceService.fetchMahsolyPrices(crop)
    ↓
Store suggestedPrice in listing
    ↓
Return listing with market price suggestion

---

List Listings Request
    ↓
Fetch all active listings
    ↓
For each listing:
  - Fetch Mahsoly prices for that crop
  - Calculate price comparison
  - Enrich with market data
    ↓
Return enriched listings
```

## Testing

Run tests to verify crop prices functionality:

```bash
node ./test-runner.js
```

Includes 5 new tests:

- ✅ Dashboard crop prices
- ✅ Marketplace listing with price suggestion
- ✅ Marketplace listing enrichment with prices
- ✅ Dashboard stats with prices
- ✅ Farmer price comparison

## REST Client Examples

See `test-mahsoly-prices.http` for examples of:

1. Getting dashboard with crop prices (English/Arabic)
2. Listing marketplace with price comparison
3. Creating listings with automatic price suggestions

## Error Handling

If Mahsoly API is unavailable:

- Dashboard falls back to previously cached data
- Marketplace uses fallback mock prices
- System remains functional without interruption

## Future Enhancements

1. **Price History Charts** - Show price trends over time
2. **Crop Price Alerts** - Notify farmers when prices spike
3. **Predictive Pricing** - ML-based price forecasting
4. **Regional Pricing** - Different prices by location
5. **Price Negotiation** - In-app negotiation features
