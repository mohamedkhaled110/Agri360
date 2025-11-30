# 📮 Agri360 Postman API Collection

## 🚀 Quick Start

**Server**: `http://localhost:5000`  
**Base Path**: `/api`

---

## 🔐 Authentication

### 1️⃣ Register New User

**POST** `http://localhost:5000/api/auth/register`

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "name": "Ahmed Farmer",
  "email": "ahmed@farm.com",
  "password": "password123",
  "role": "farmer",
  "country": "Egypt",
  "governorate": "Giza"
}
```

**Response:**

```json
{
  "user": {
    "_id": "user_id_here",
    "name": "Ahmed Farmer",
    "email": "ahmed@farm.com",
    "role": "farmer",
    "country": "Egypt",
    "governorate": "Giza"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2️⃣ Login

**POST** `http://localhost:5000/api/auth/login`

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "email": "ahmed@farm.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "_id": "user_id_here",
    "name": "Ahmed Farmer",
    "email": "ahmed@farm.com",
    "role": "farmer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3️⃣ Get Current User

**GET** `http://localhost:5000/api/auth/me`

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**

```json
{
  "user": {
    "_id": "user_id_here",
    "name": "Ahmed Farmer",
    "email": "ahmed@farm.com"
  }
}
```

---

## 🌾 Business Plans (WITH MAHSOLY DATA)

### 4️⃣ Create Business Plan ⭐

**POST** `http://localhost:5000/api/business`

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "farm": {
    "_id": "farm_123",
    "farmName": "Green Valley Farm",
    "fieldSizeHectares": 5,
    "location": {
      "lat": 30.0444,
      "lon": 31.2357
    },
    "owner": "user_id_here",
    "soilType": "clay",
    "waterSource": "irrigation"
  },
  "crop": "wheat",
  "cropCode": 56,
  "investmentCost": 5000,
  "duration": 120,
  "expectedYield": 15
}
```

**Response (includes MAHSOLY MARKET DATA):**

```json
{
  "businessPlan": {
    "_id": "plan_123",
    "farm": "farm_id",
    "crop": "wheat",
    "cropCode": 56,
    "investmentCost": 5000,
    "duration": 120,
    "expectedYield": 15,
    "aiGeneratedPlan": {
      "executive_summary": "...",
      "market_analysis": {
        "current_price": "₹ (from Mahsoly /stockmarket)",
        "price_trend": "Based on Mahsoly data",
        "market_opportunities": "..."
      },
      "profitability_analysis": {
        "revenue_estimate": "Based on Mahsoly market prices",
        "cost_breakdown": "...",
        "profit_margin": "..."
      },
      "risk_assessment": "...",
      "recommendations": "..."
    },
    "mahsolyData": {
      "source": "mahsoly-api",
      "timestamp": "2025-11-15T10:30:00Z",
      "marketData": {
        "endpoint": "/stockmarket",
        "count": 50,
        "prices": [...]
      },
      "itemsData": {
        "endpoint": "/item/all",
        "count": 25,
        "items": [...]
      },
      "farmsData": {
        "endpoint": "/farm/all",
        "count": 10,
        "farms": [...]
      }
    },
    "createdAt": "2025-11-15T10:30:00Z"
  }
}
```

---

### 5️⃣ List All Business Plans

**GET** `http://localhost:5000/api/business`

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Query Parameters (optional):**

```
?farmer=FARMER_ID
```

**Response:**

```json
{
  "businessPlans": [
    {
      "_id": "plan_1",
      "farm": "...",
      "crop": "wheat",
      "investmentCost": 5000,
      "createdAt": "2025-11-15T10:30:00Z"
    }
  ]
}
```

---

### 6️⃣ Get Business Plan by ID

**GET** `http://localhost:5000/api/business/:id`

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example URL:**

```
http://localhost:5000/api/business/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "businessPlan": {
    "_id": "507f1f77bcf86cd799439011",
    "farm": "...",
    "crop": "wheat",
    "aiGeneratedPlan": {...},
    "mahsolyData": {...}
  }
}
```

---

### 7️⃣ Update Business Plan

**PUT** `http://localhost:5000/api/business/:id`

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "investmentCost": 6000,
  "expectedYield": 16,
  "status": "approved"
}
```

**Response:**

```json
{
  "businessPlan": {
    "_id": "507f1f77bcf86cd799439011",
    "investmentCost": 6000,
    "expectedYield": 16,
    "status": "approved"
  }
}
```

---

### 8️⃣ Delete Business Plan

**DELETE** `http://localhost:5000/api/business/:id`

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example URL:**

```
http://localhost:5000/api/business/507f1f77bcf86cd799439011
```

**Response:**

```
204 No Content
```

---

## 📊 Dashboard (WITH MAHSOLY DATA)

### 9️⃣ Get Dashboard Stats

**GET** `http://localhost:5000/api/dashboard`

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (includes MAHSOLY PRICES & MARKET DATA):**

```json
{
  "stats": {
    "_id": "stat_123",
    "crop": "wheat",
    "farm": "farm_id",
    "cropPriceTrends": {
      "source": "mahsoly-api",
      "marketData": {
        "prices": [
          { "date": "2025-11-15", "price": 250, "currency": "EGP" },
          { "date": "2025-11-14", "price": 248, "currency": "EGP" }
        ]
      },
      "itemsData": {
        "items": ["Wheat Grade A", "Wheat Grade B"]
      },
      "farmsData": {
        "farms": ["Farm Type 1", "Farm Type 2"]
      }
    },
    "currencyImpact": {
      "usdToEgp": 49.5,
      "impact": 0.8
    },
    "newsImpact": {
      "sentiment": "positive",
      "score": 0.7
    },
    "weatherImpact": {
      "rainfall": 2.5,
      "temperature": 24,
      "humidity": 65
    },
    "riskScore": 35,
    "alerts": ["Water shortage expected", "Market prices rising"],
    "createdAt": "2025-11-15T10:30:00Z"
  }
}
```

---

### 🔟 Compute Dashboard Stats ⭐

**POST** `http://localhost:5000/api/dashboard/compute`

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "crop": "wheat",
  "farm": {
    "_id": "farm_123",
    "farmName": "Green Valley Farm",
    "fieldSizeHectares": 5,
    "location": {
      "lat": 30.0444,
      "lon": 31.2357
    },
    "soilType": "clay",
    "waterSource": "irrigation"
  }
}
```

**Response (MAHSOLY DATA INCLUDED):**

```json
{
  "stats": {
    "_id": "stat_789",
    "crop": "wheat",
    "farm": "farm_123",
    "cropPriceTrends": {
      "source": "mahsoly-api",
      "timestamp": "2025-11-15T10:35:00Z",
      "marketData": {
        "endpoint": "/stockmarket",
        "count": 50,
        "prices": [...]
      },
      "itemsData": {
        "endpoint": "/item/all",
        "items": [...]
      },
      "farmsData": {
        "endpoint": "/farm/all",
        "farms": [...]
      }
    },
    "currencyImpact": {...},
    "newsImpact": {...},
    "weatherImpact": {...},
    "oilImpact": {...},
    "riskScore": 38,
    "alerts": [
      "Mahsoly market prices rising by 5% this week",
      "Rainfall expected in 2 days",
      "Oil prices stable"
    ],
    "createdAt": "2025-11-15T10:35:00Z"
  }
}
```

---

## 🌾 Harvest Plans

### 1️⃣1️⃣ Create Harvest Plan

**POST** `http://localhost:5000/api/harvest`

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "crop": "wheat",
  "farm": "farm_123",
  "plantingDate": "2025-10-01",
  "expectedHarvestDate": "2026-01-30",
  "estimatedYield": 15,
  "harvestMethod": "mechanical"
}
```

**Response:**

```json
{
  "harvestPlan": {
    "_id": "harvest_123",
    "crop": "wheat",
    "farm": "farm_123",
    "plantingDate": "2025-10-01",
    "expectedHarvestDate": "2026-01-30",
    "estimatedYield": 15,
    "harvestMethod": "mechanical",
    "aiGeneratedPlan": {...}
  }
}
```

---

## 🏪 Marketplace

### 1️⃣2️⃣ Create Marketplace Listing

**POST** `http://localhost:5000/api/marketplace`

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "crop": "wheat",
  "quantity": 100,
  "unit": "kg",
  "pricePerUnit": 250,
  "currency": "EGP",
  "harvestDate": "2025-11-15",
  "description": "High quality wheat from Green Valley Farm"
}
```

**Response:**

```json
{
  "listing": {
    "_id": "listing_123",
    "seller": "user_id",
    "crop": "wheat",
    "quantity": 100,
    "unit": "kg",
    "pricePerUnit": 250,
    "currency": "EGP",
    "totalPrice": 25000,
    "status": "active",
    "createdAt": "2025-11-15T10:30:00Z"
  }
}
```

---

## 🔧 Farms

### 1️⃣3️⃣ Create Farm

**POST** `http://localhost:5000/api/farms`

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "farmName": "Green Valley Farm",
  "fieldSizeHectares": 5,
  "location": {
    "lat": 30.0444,
    "lon": 31.2357,
    "address": "Giza, Egypt"
  },
  "soilType": "clay",
  "waterSource": "irrigation",
  "crops": ["wheat", "corn"]
}
```

**Response:**

```json
{
  "farm": {
    "_id": "farm_123",
    "owner": "user_id",
    "farmName": "Green Valley Farm",
    "fieldSizeHectares": 5,
    "location": {...},
    "soilType": "clay",
    "waterSource": "irrigation",
    "crops": ["wheat", "corn"],
    "createdAt": "2025-11-15T10:30:00Z"
  }
}
```

---

## 📋 Environment Setup for Postman

### Step 1: Create Environment

In Postman:

1. Click **Environments** → **+** → **Create Environment**
2. Name it: `Agri360 Local`

### Step 2: Add Variables

Add these variables:

```
BASE_URL = http://localhost:5000/api
TOKEN = (leave empty, will be filled after login)
SERVER = http://localhost:5000
```

### Step 3: Get Token

1. Call **Register** (request 1) or **Login** (request 2)
2. Copy the `token` from response
3. Set as `{{TOKEN}}` in Postman environment

### Step 4: Use Token in Requests

In request headers, use:

```
Authorization: Bearer {{TOKEN}}
```

---

## ✅ MAHSOLY API Features Testing

### Test 1: Market Prices

**Endpoint**: Create Business Plan → Check `mahsolyData.marketData`

- Shows real Egyptian market prices from `/stockmarket`
- Updated daily by Mahsoly API
- Used for profit calculations

### Test 2: Crop Items

**Endpoint**: Create Business Plan → Check `mahsolyData.itemsData`

- Shows available crop items
- From Mahsoly `/item/all` endpoint
- Used for crop recommendations

### Test 3: Farm Types

**Endpoint**: Create Business Plan → Check `mahsolyData.farmsData`

- Shows available farm types
- From Mahsoly `/farm/all` endpoint
- Used for validation

### Test 4: Market-Backed Pricing

**Endpoint**: Create Business Plan

- AI uses Mahsoly prices for revenue estimates
- Profit calculations based on real market data
- More accurate predictions

### Test 5: Dashboard Market Trends

**Endpoint**: Compute Dashboard → Check `cropPriceTrends`

- Shows market trends with Mahsoly data
- Prices, available items, farm types
- Used for risk analysis

---

## 🎯 Testing Workflow

### Complete Test Flow

```
1. REGISTER (or LOGIN if exists)
   → Get TOKEN

2. CREATE FARM (optional, or use test farm object)
   → Get FARM_ID

3. CREATE BUSINESS PLAN ⭐
   → Pass farm object + crop info
   → Check mahsolyData in response
   → See market prices, items, farms

4. GET BUSINESS PLAN by ID
   → Verify mahsolyData persisted

5. COMPUTE DASHBOARD ⭐
   → Pass crop + farm
   → Check cropPriceTrends with Mahsoly data

6. CREATE HARVEST PLAN
   → See AI-generated harvest recommendations

7. CREATE MARKETPLACE LISTING
   → List crop for sale with Mahsoly-based pricing
```

---

## 🚨 Error Handling

### Common Responses

**401 Unauthorized**

```json
{
  "message": "No token, authorization denied"
}
```

→ Add `Authorization: Bearer {{TOKEN}}` header

**400 Bad Request**

```json
{
  "message": "Missing required fields"
}
```

→ Check request body has all required fields

**404 Not Found**

```json
{
  "message": "Not found"
}
```

→ Verify ID is correct

**500 Server Error**

```json
{
  "message": "Server error"
}
```

→ Check server logs on terminal

---

## 📞 Support

**Server Status**: Check terminal for logs

```
✅ Server running on port 5000
✅ Connected to MongoDB
✅ All routes mounted
```

**Mahsoly Integration**:

- ✅ Stock market prices available
- ✅ Crop items available
- ✅ Farm types available
- ✅ All endpoints callable

**Test Suite**: Run `node test-mahsoly.js` to verify integration

---

**Last Updated**: November 15, 2025  
**Version**: 1.0  
**Status**: ✅ All endpoints working with MAHSOLY API
