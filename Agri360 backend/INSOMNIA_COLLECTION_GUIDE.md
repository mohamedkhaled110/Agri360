# 📥 Insomnia Collection Guide - Agri360 API

## 🚀 Quick Start

### 1. Import the Collection

1. Open **Insomnia**
2. Go to **File → Import from File**
3. Select: `Agri360_Insomnia_Collection.json`
4. Click **Import**

### 2. Set Environment Variables

1. Click **Environment** at the bottom left
2. Select **Local Development**
3. Update these variables:
   - `baseUrl`: `http://localhost:3000`
   - `token`: Your JWT token (get it from Login endpoint)
   - `farmerId`: Your user ID
   - `farmerEmail`: `ahmed@farm.com`
   - `farmerPassword`: `password123`

### 3. Start Testing!

---

## 📋 Collection Structure

### 🔐 **Authentication** (7 requests)

- Register New Farmer
- Login
- Get Current User

### 📊 **Dashboard** (4 requests)

- Dashboard Stats (English)
- Dashboard Stats (Arabic - Egyptian)
- Dashboard Stats (Arabic - Saudi)
- Dashboard - View Crop Prices ⭐ **NEW**

### 🏪 **Marketplace** (5 requests)

- List Marketplace Listings (English)
- List Marketplace Listings (Arabic - EG)
- List Marketplace - With Mahsoly Prices ⭐ **NEW**
- Create Listing (English)
- Create Listing (Arabic - EG)

### 🌾 **Farm Management** (4 requests)

- Create Farm (English)
- Create Farm (Arabic - EG)
- List Farms (English)
- List Farms (Arabic - EG)
- Get Weather Forecast (Arabic) ⭐ **NEW**

### 📋 **Business Plan** (2 requests)

- Generate Business Plan (English)
- Generate Business Plan (Arabic - EG)

### 🌱 **Harvest Planning** (2 requests)

- Create Harvest Plan (English)
- Create Harvest Plan (Arabic - EG)

### 🤖 **AI Services** (2 requests)

- AI Chat - Crop Planning (Arabic)
- AI Chat - General (Arabic)

---

## 🧪 Complete API Test Workflow

### Step 1: Register a New Farmer

```
POST /auth/register
```

**Request:**

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
    "_id": "user_id_123",
    "name": "Ahmed Hassan",
    "email": "ahmed@farm.com",
    "lang": "ar-EG"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ **Copy the token and save to environment**

---

### Step 2: View Dashboard with Crop Prices (English)

```
GET /dashboard/stats?lang=en
```

**Headers:**

```
Authorization: Bearer {{ token }}
Accept-Language: en
```

**Response includes:**

```json
{
  "stats": {
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

---

### Step 3: View Dashboard with Crop Prices (Arabic - Egyptian)

```
GET /dashboard/stats?lang=ar-EG
```

**Headers:**

```
Authorization: Bearer {{ token }}
Accept-Language: ar-EG
```

**Response:** Same data, Arabic-localized messages

---

### Step 4: Create a Farm (English)

```
POST /farm
```

**Request:**

```json
{
  "name": "Ahmed's Farm",
  "location": "Giza, Egypt",
  "area": 50,
  "crops": ["Wheat", "Rice", "Corn"]
}
```

---

### Step 5: Create a Farm (Arabic - Egyptian)

```
POST /farm?lang=ar-EG
```

**Request:**

```json
{
  "name": "مزرعة أحمد",
  "location": "الجيزة، مصر",
  "area": 50,
  "crops": ["القمح", "الأرز", "الذرة"]
}
```

---

### Step 6: Generate Business Plan (Arabic)

```
POST /businessPlan/generate
```

**Request:**

```json
{
  "crop": "القمح",
  "area": 50,
  "region": "الجيزة",
  "lang": "ar-EG"
}
```

**Response:** Complete business plan for wheat in Arabic 🎉

---

### Step 7: Create Marketplace Listing with Price Suggestion

```
POST /marketplace/listings
```

**Request:**

```json
{
  "title": "Premium Wheat",
  "description": "High quality wheat from Nile Delta",
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
    "title": "Premium Wheat",
    "crop": "Wheat",
    "pricePerUnit": 450,
    "suggestedPrice": 450
  },
  "marketPriceSuggestion": {
    "price": 450,
    "currency": "EGP",
    "source": "mahsoly"
  }
}
```

---

### Step 8: View Marketplace Listings with Price Comparison

```
GET /marketplace/listings
```

**Headers:**

```
Authorization: Bearer {{ token }}
```

**Response includes:**

```json
{
  "listings": [
    {
      "title": "Premium Wheat",
      "crop": "Wheat",
      "pricePerUnit": 450,
      "farmer": {
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

---

### Step 9: Create Harvest Plan (Arabic)

```
POST /harvestPlan?lang=ar-EG
```

**Request:**

```json
{
  "crop": "القمح",
  "plantingDate": "2025-10-01",
  "expectedHarvestDate": "2026-05-01",
  "expectedYield": 2500
}
```

---

### Step 10: AI Chat - Crop Planning (Arabic)

```
POST /chat
```

**Request:**

```json
{
  "mode": "planning",
  "message": "كيف أزرع القمح بكفاءة",
  "lang": "ar-EG"
}
```

**Response:** AI-generated advice in Arabic 🤖

---

## 🌐 Language Support

All endpoints support multiple languages:

### Query Parameter

```
?lang=en       # English
?lang=ar       # Arabic (defaults to ar-EG)
?lang=ar-EG    # Arabic (Egyptian - Colloquial)
?lang=ar-SA    # Arabic (Saudi - Formal)
```

### Header

```
Accept-Language: en
Accept-Language: ar-EG
Accept-Language: ar-SA
```

### Priority

1. **Query parameter** (`?lang=...`) - Highest priority
2. **User language** (saved in user profile)
3. **Accept-Language header** - Medium priority
4. **Default** - English

---

## ⭐ New Features Tested

### 1. Dashboard Crop Prices

✅ Real-time Mahsoly market prices  
✅ Multiple language support  
✅ Last update timestamp

### 2. Marketplace Price Suggestions

✅ Automatic market price fetching  
✅ Suggested price on listing creation  
✅ Price comparison when viewing listings

### 3. Arabic Support

✅ Egyptian Arabic (ar-EG) - Default colloquial  
✅ Saudi Arabic (ar-SA) - Formal MSA  
✅ English fallback for all endpoints  
✅ Error messages in user's language

### 4. AI Services in Arabic

✅ Business plans in Arabic  
✅ Harvest planning in Arabic  
✅ Chat assistance in Arabic

---

## 🔍 Testing Checklist

Use this checklist when testing all endpoints:

### Authentication

- [ ] Register new farmer
- [ ] Login with credentials
- [ ] Get current user profile

### Dashboard

- [ ] View dashboard (English)
- [ ] View dashboard (Arabic - EG)
- [ ] View dashboard (Arabic - SA)
- [ ] Verify crop prices included

### Marketplace

- [ ] Create listing (English)
- [ ] Create listing (Arabic)
- [ ] List all active listings
- [ ] Verify market prices in listings
- [ ] Verify price comparison data

### Farm

- [ ] Create farm (English)
- [ ] Create farm (Arabic)
- [ ] List farms (English)
- [ ] List farms (Arabic)
- [ ] Get weather forecast

### Business Planning

- [ ] Generate plan (English)
- [ ] Generate plan (Arabic)
- [ ] Verify AI response language matches

### Harvest Planning

- [ ] Create plan (English)
- [ ] Create plan (Arabic)

### AI Chat

- [ ] Crop planning chat (Arabic)
- [ ] General chat (Arabic)
- [ ] Verify responses in Arabic

---

## 📊 Request/Response Examples

### Dashboard Response Structure

```json
{
  "stats": {
    "cropPriceTrends": { ... },
    "currencyImpact": { ... },
    "newsImpact": { ... },
    "weatherImpact": { ... },
    "riskScore": 42,
    "alerts": ["High humidity alert"],
    "cropPrices": [
      {
        "name": "Wheat",
        "item_name": "القمح",
        "price": 450,
        "date": "2025-11-15"
      }
    ],
    "pricesSource": "mahsoly",
    "pricesLastUpdated": "2025-11-15T10:30:00Z"
  }
}
```

### Marketplace Listing Response Structure

```json
{
  "listing": {
    "_id": "listing_id_123",
    "title": "Premium Wheat",
    "description": "High quality wheat",
    "crop": "Wheat",
    "quantity": 500,
    "unit": "kg",
    "pricePerUnit": 450,
    "suggestedPrice": 450,
    "location": "Dakahlia, Egypt",
    "status": "active",
    "createdAt": "2025-11-15T10:30:00Z"
  },
  "marketPriceSuggestion": {
    "price": 450,
    "currency": "EGP",
    "source": "mahsoly"
  }
}
```

### Error Response Example (Arabic)

```json
{
  "message": "مش موجود",
  "error": "listing_not_found"
}
```

---

## 🚀 Advanced Testing

### Test Error Handling

1. Make request without Authorization header
2. Make request with invalid token
3. Make request with missing required fields
4. Verify error messages in user's language

### Test Arabic Variants Fallback

1. Request with `?lang=ar` (should fallback to ar-EG)
2. Request with `?lang=ar-XX` (non-existent variant)
3. Verify it falls back correctly

### Test Price Updates

1. Create multiple listings
2. Check if prices reflect Mahsoly updates
3. Verify price comparisons are accurate

---

## 💡 Tips & Tricks

1. **Save Token**: After login, copy token to environment
2. **Use Environments**: Switch between Development/Production
3. **Chain Requests**: Use `set` in tests to save response data
4. **Test Variables**: Use `{{ variable }}` syntax
5. **Export Results**: Use Reports tab for testing summary

---

## 🔗 Related Documentation

- `MAHSOLY_PRICES_INTEGRATION.md` - Crop prices feature details
- `ARABIC_LOCALIZATION_GUIDE.md` - Language support details
- `CROP_PRICES_IMPLEMENTATION_SUMMARY.md` - Implementation overview
- `test-mahsoly-prices.http` - VS Code REST Client examples

---

## ❓ Troubleshooting

### "Invalid Token" Error

- Get a new token from Login endpoint
- Update `{{ token }}` in environment

### "CORS" Error

- Ensure server is running on port 3000
- Check `baseUrl` in environment settings

### Arabic Text Not Displaying

- Check Insomnia font settings
- Enable UTF-8 encoding

### Price Data Missing

- Verify Mahsoly API is accessible
- Check environment setup
- Review server logs

---

## 📞 Support

For issues or questions:

1. Check server logs for errors
2. Verify environment variables
3. Ensure API server is running
4. Test with curl command in terminal
