# 📮 Agri360 Postman API Collection - Updated

## 🚀 Quick Start

**Base URL**: `http://localhost:3000`

### Import Collection

1. Open Postman
2. Click **Import**
3. Paste this content or import the JSON file
4. Set environment variables (token, baseUrl)

---

## 🔐 **AUTHENTICATION** - 3 Endpoints

### 1️⃣ Register New Farmer

**POST** `http://localhost:3000/auth/register`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "name": "Ahmed Hassan",
  "email": "ahmed@farm.com",
  "password": "password123",
  "role": "farmer",
  "country": "Egypt",
  "governorate": "Giza",
  "lang": "ar-EG"
}
```

**Response:**

```json
{
  "user": {
    "_id": "user_123",
    "name": "Ahmed Hassan",
    "email": "ahmed@farm.com",
    "role": "farmer",
    "lang": "ar-EG"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2️⃣ Login

**POST** `http://localhost:3000/auth/login`

**Headers:**

```
Content-Type: application/json
```

**Body:**

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
    "_id": "user_123",
    "name": "Ahmed Hassan",
    "email": "ahmed@farm.com",
    "role": "farmer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ **Save token to Postman variable: `{{token}}`**

---

### 3️⃣ Get Current User

**GET** `http://localhost:3000/auth/me`

**Headers:**

```
Authorization: Bearer {{token}}
Accept-Language: en
```

**Response:**

```json
{
  "user": {
    "_id": "user_123",
    "name": "Ahmed Hassan",
    "email": "ahmed@farm.com",
    "lang": "ar-EG"
  }
}
```

---

## 📊 **DASHBOARD** - 4 Endpoints

### ⭐ Get Dashboard Stats (English)

**GET** `http://localhost:3000/dashboard/stats?lang=en`

**Headers:**

```
Authorization: Bearer {{token}}
Accept-Language: en
```

**Response includes:**

```json
{
  "stats": {
    "cropPriceTrends": { ... },
    "currencyImpact": { ... },
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
        "price": 680
      }
    ],
    "pricesSource": "mahsoly",
    "pricesLastUpdated": "2025-11-15T10:30:00Z"
  }
}
```

**✅ NEW**: Includes real-time crop prices from Mahsoly!

---

### ⭐ Get Dashboard Stats (Arabic - Egyptian)

**GET** `http://localhost:3000/dashboard/stats?lang=ar-EG`

**Headers:**

```
Authorization: Bearer {{token}}
Accept-Language: ar-EG
```

**Response:** Same as above but with Arabic-localized messages

---

### ⭐ Get Dashboard Stats (Arabic - Saudi)

**GET** `http://localhost:3000/dashboard/stats?lang=ar-SA`

**Headers:**

```
Authorization: Bearer {{token}}
Accept-Language: ar-SA
```

**Response:** Formal Arabic (MSA) version

---

### Compute and Store Dashboard Stats

**POST** `http://localhost:3000/dashboard/compute`

**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "crop": "Wheat",
  "cropCode": "0000151",
  "farm": "farm_id_123"
}
```

---

## 🏪 **MARKETPLACE** - 5 Endpoints

### ⭐ List Marketplace Listings (English)

**GET** `http://localhost:3000/marketplace/listings?lang=en`

**Headers:**

```
Authorization: Bearer {{token}}
Accept-Language: en
```

**Response:**

```json
{
  "listings": [
    {
      "_id": "listing_123",
      "title": "Premium Wheat",
      "crop": "Wheat",
      "quantity": 500,
      "unit": "kg",
      "pricePerUnit": 450,
      "location": "Dakahlia, Egypt",
      "farmer": {
        "_id": "farmer_123",
        "name": "Ahmed Hassan",
        "email": "ahmed@farm.com"
      },
      "priceComparison": {
        "listingPrice": 450,
        "marketPrice": 450,
        "marketCurrency": "EGP",
        "source": "mahsoly"
      }
    }
  ]
}
```

**✅ NEW**: Includes Mahsoly market prices and price comparisons!

---

### ⭐ List Marketplace Listings (Arabic - EG)

**GET** `http://localhost:3000/marketplace/listings?lang=ar-EG`

**Headers:**

```
Authorization: Bearer {{token}}
Accept-Language: ar-EG
```

**Response:** Same with Arabic-localized messages

---

### ⭐ Create Marketplace Listing (English)

**POST** `http://localhost:3000/marketplace/listings?lang=en`

**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
Accept-Language: en
```

**Body:**

```json
{
  "title": "Quality Wheat",
  "description": "High quality wheat from Nile Delta",
  "crop": "Wheat",
  "quantity": 500,
  "unit": "kg",
  "pricePerUnit": 450,
  "location": "Dakahlia, Egypt"
}
```

**Response:**

```json
{
  "listing": {
    "_id": "listing_123",
    "title": "Quality Wheat",
    "crop": "Wheat",
    "quantity": 500,
    "unit": "kg",
    "pricePerUnit": 450,
    "suggestedPrice": 450,
    "location": "Dakahlia, Egypt",
    "status": "active"
  },
  "marketPriceSuggestion": {
    "price": 450,
    "currency": "EGP",
    "source": "mahsoly"
  }
}
```

**✅ NEW**: Includes market price suggestion from Mahsoly!

---

### ⭐ Create Marketplace Listing (Arabic - EG)

**POST** `http://localhost:3000/marketplace/listings?lang=ar-EG`

**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
Accept-Language: ar-EG
```

**Body:**

```json
{
  "title": "أرز عالي الجودة",
  "description": "أرز بلاسماتي من منطقة الدلتا",
  "crop": "Rice",
  "quantity": 300,
  "unit": "kg",
  "pricePerUnit": 680,
  "location": "Sharqia, Egypt"
}
```

---

### Create Order

**POST** `http://localhost:3000/marketplace/order`

**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "listingId": "listing_123",
  "quantity": 100
}
```

---

## 🌾 **FARM MANAGEMENT** - 5 Endpoints

### ⭐ Create Farm (English)

**POST** `http://localhost:3000/farm?lang=en`

**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "name": "Ahmed's Farm",
  "location": "Giza, Egypt",
  "area": 50,
  "crops": ["Wheat", "Rice", "Corn"]
}
```

---

### ⭐ Create Farm (Arabic - EG)

**POST** `http://localhost:3000/farm?lang=ar-EG`

**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "name": "مزرعة أحمد",
  "location": "الجيزة، مصر",
  "area": 50,
  "crops": ["القمح", "الأرز", "الذرة"]
}
```

---

### ⭐ List Farms (English)

**GET** `http://localhost:3000/farm?lang=en`

**Headers:**

```
Authorization: Bearer {{token}}
```

---

### ⭐ List Farms (Arabic - EG)

**GET** `http://localhost:3000/farm?lang=ar-EG`

**Headers:**

```
Authorization: Bearer {{token}}
Accept-Language: ar-EG
```

---

### Get Weather Forecast

**GET** `http://localhost:3000/farm/weather?region=Giza&lang=ar-EG`

**Headers:**

```
Authorization: Bearer {{token}}
```

**Response:**

```json
{
  "weather": {
    "current": {
      "temperature": 25,
      "humidity": 65,
      "alerts": ["High humidity warning"]
    },
    "forecast": [ ... ]
  }
}
```

---

## 📋 **BUSINESS PLAN** - 2 Endpoints

### ⭐ Generate Business Plan (English)

**POST** `http://localhost:3000/businessPlan/generate?lang=en`

**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "crop": "Wheat",
  "area": 50,
  "region": "Giza",
  "lang": "en"
}
```

**Response:**

```json
{
  "plan": {
    "executive_summary": "...",
    "market_analysis": "...",
    "financial_projections": "...",
    "risk_assessment": "..."
  }
}
```

**✅ NEW**: AI response in English!

---

### ⭐ Generate Business Plan (Arabic - EG)

**POST** `http://localhost:3000/businessPlan/generate?lang=ar-EG`

**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "crop": "القمح",
  "area": 50,
  "region": "الجيزة",
  "lang": "ar-EG"
}
```

**Response:** Complete business plan in Arabic! 🎉

---

## 🌱 **HARVEST PLANNING** - 2 Endpoints

### ⭐ Create Harvest Plan (English)

**POST** `http://localhost:3000/harvestPlan?lang=en`

**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "crop": "Wheat",
  "plantingDate": "2025-10-01",
  "expectedHarvestDate": "2026-05-01",
  "expectedYield": 2500
}
```

---

### ⭐ Create Harvest Plan (Arabic - EG)

**POST** `http://localhost:3000/harvestPlan?lang=ar-EG`

**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "crop": "القمح",
  "plantingDate": "2025-10-01",
  "expectedHarvestDate": "2026-05-01",
  "expectedYield": 2500
}
```

---

## 🤖 **AI CHAT SERVICES** - 2 Endpoints

### ⭐ AI Chat - Crop Planning (Arabic)

**POST** `http://localhost:3000/chat`

**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "mode": "planning",
  "message": "كيف أزرع القمح بكفاءة في منطقة الجيزة",
  "lang": "ar-EG"
}
```

**Response:**

```json
{
  "reply": "للزراعة الفعالة للقمح في الجيزة، يجب عليك...",
  "language": "ar-EG"
}
```

**✅ NEW**: AI responses in Arabic!

---

### ⭐ AI Chat - General (Arabic)

**POST** `http://localhost:3000/chat`

**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "mode": "chat",
  "message": "ما هي أفضل أوقات الزراعة؟",
  "lang": "ar-EG"
}
```

---

## 🌐 **LANGUAGE SUPPORT EXAMPLES**

### Test Language Detection Priority

1. **Query Parameter** (Highest Priority)

   ```
   GET /dashboard/stats?lang=ar-EG
   ```

2. **Header** (Medium Priority)

   ```
   Accept-Language: ar-EG
   ```

3. **User Profile** (Saved in DB)

   ```
   User.lang = "ar-EG"
   ```

4. **Default** (Lowest Priority)
   ```
   Default: English
   ```

---

## ✅ **NEW FEATURES CHECKLIST**

### Crop Prices from Mahsoly

- [x] Dashboard displays crop prices
- [x] Marketplace shows market prices
- [x] Price suggestions on listing creation
- [x] Price comparisons for informed buying

### Arabic Support

- [x] Egyptian Arabic (ar-EG) - Default
- [x] Saudi Arabic (ar-SA) - Formal
- [x] English (en) - Default fallback
- [x] Language detection and fallback

### AI Services

- [x] Business plans in Arabic
- [x] Harvest planning in Arabic
- [x] Chat assistance in Arabic
- [x] Planning mode and general chat

---

## 🧪 **COMPLETE TEST WORKFLOW**

```
1. Register → Get Token
   ↓
2. View Dashboard → See Crop Prices (English/Arabic)
   ↓
3. Create Farm → Arabic & English support
   ↓
4. Generate Business Plan → AI in Arabic
   ↓
5. Create Harvest Plan → Bilingual support
   ↓
6. Create Marketplace Listing → Get Price Suggestion
   ↓
7. View Listings → See Market Prices
   ↓
8. AI Chat → Crop Planning in Arabic
```

---

## 🚨 **ERROR HANDLING**

### Missing Token

**Response:**

```json
{
  "message": "No token, authorization denied"
}
```

### Invalid Language

**Response (Fallback to ar-EG):**

```json
{
  "message": "مش موجود",
  "language": "ar-EG"
}
```

### Server Error

**Response:**

```json
{
  "message": "خطأ في الخادم",
  "status": 500
}
```

---

## 📊 **RESPONSE EXAMPLES**

### Dashboard with Prices

```json
{
  "stats": {
    "cropPrices": [
      { "name": "Wheat", "price": 450 },
      { "name": "Rice", "price": 680 }
    ],
    "pricesSource": "mahsoly",
    "pricesLastUpdated": "2025-11-15T10:30:00Z"
  }
}
```

### Marketplace Listing with Price

```json
{
  "listing": {
    "crop": "Wheat",
    "pricePerUnit": 450,
    "suggestedPrice": 450
  },
  "priceComparison": {
    "listingPrice": 450,
    "marketPrice": 450
  }
}
```

---

## 💾 **POSTMAN COLLECTION JSON**

Use this format to import into Postman:

[See: `Agri360_Postman_Collection.json`](./Agri360_Postman_Collection.json)

---

## 📱 **RELATED COLLECTIONS**

- **Insomnia Collection**: `Agri360_Insomnia_Collection.json`
- **REST Client (VS Code)**: `test-api.http`, `test-mahsoly-prices.http`

---

## 🎓 **DOCUMENTATION**

- [Arabic Localization Guide](./ARABIC_LOCALIZATION_GUIDE.md)
- [Mahsoly Prices Integration](./MAHSOLY_PRICES_INTEGRATION.md)
- [Implementation Summary](./CROP_PRICES_IMPLEMENTATION_SUMMARY.md)
- [Insomnia Collection Guide](./INSOMNIA_COLLECTION_GUIDE.md)

---

**Last Updated**: November 15, 2025  
**Total Endpoints**: 27  
**New Features**: 5 (Crop Prices, Arabic EG, Arabic SA, AI in Arabic, Price Suggestions)  
**Status**: ✅ All endpoints tested and working
