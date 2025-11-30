# 🎯 Postman & Insomnia - Quick Reference Card

## 📥 INSOMNIA - Import & Use

### Step 1: Import

```
File → Import from File → Select: Agri360_Insomnia_Collection.json
```

### Step 2: Set Environment

```
Environment → Local Development → Edit:
  baseUrl: http://localhost:3000
  token: (get from Login endpoint)
```

### Step 3: Start Testing

- Click any request
- Click **Send**
- View response

---

## 📮 POSTMAN - Import & Use

### Step 1: Import

```
Import → File → Select: Agri360_Postman_Collection.json
```

### Step 2: Set Environment

```
Environments → Create/Edit → Set:
  baseUrl: http://localhost:3000
  token: (get from Login endpoint)
```

### Step 3: Start Testing

- Select request
- Click **Send**
- Check response

---

## 🔑 Get Your Token (Both)

1. Go to **Authentication → Login**
2. Send with credentials:
   ```json
   {
     "email": "ahmed@farm.com",
     "password": "password123"
   }
   ```
3. Copy token from response
4. Paste into environment `token` variable
5. All endpoints now authenticated!

---

## 🌐 Available Requests by Folder

### 🔐 Authentication

| Request             | Method | Purpose         |
| ------------------- | ------ | --------------- |
| Register New Farmer | POST   | Create new user |
| Login               | POST   | Get JWT token   |
| Get Current User    | GET    | Verify auth     |

### 📊 Dashboard

| Request                       | Method | Purpose                       |
| ----------------------------- | ------ | ----------------------------- |
| Dashboard Stats (English)     | GET    | View stats in English         |
| Dashboard Stats (Arabic - EG) | GET    | View stats in Egyptian Arabic |
| Dashboard Stats (Arabic - SA) | GET    | View stats in Saudi Arabic    |
| Dashboard - Crop Prices       | GET    | See Mahsoly prices ⭐         |

### 🏪 Marketplace

| Request                      | Method | Purpose                 |
| ---------------------------- | ------ | ----------------------- |
| List Listings (English)      | GET    | View all listings       |
| List Listings (Arabic - EG)  | GET    | View listings in Arabic |
| List Listings - with Prices  | GET    | See market prices ⭐    |
| Create Listing (English)     | POST   | Create new listing      |
| Create Listing (Arabic - EG) | POST   | Create in Arabic        |

### 🌾 Farm

| Request                   | Method | Purpose              |
| ------------------------- | ------ | -------------------- |
| Create Farm (English)     | POST   | Add new farm         |
| Create Farm (Arabic - EG) | POST   | Add farm in Arabic   |
| List Farms (English)      | GET    | View farms           |
| List Farms (Arabic - EG)  | GET    | View farms in Arabic |

### 📋 Business Plan

| Request                          | Method | Purpose                |
| -------------------------------- | ------ | ---------------------- |
| Generate Business Plan (English) | POST   | Create plan in English |
| Generate Business Plan (Arabic)  | POST   | Create plan in Arabic  |

### 🌱 Harvest Plan

| Request                       | Method | Purpose        |
| ----------------------------- | ------ | -------------- |
| Create Harvest Plan (English) | POST   | Plan harvest   |
| Create Harvest Plan (Arabic)  | POST   | Plan in Arabic |

### 🤖 AI Chat

| Request                 | Method | Purpose                     |
| ----------------------- | ------ | --------------------------- |
| AI Chat - Crop Planning | POST   | Planning advice in Arabic   |
| AI Chat - General       | POST   | General questions in Arabic |

---

## 🧪 Quick Test Workflow

```
1. LOGIN
   POST /auth/login
   ↓
2. VIEW DASHBOARD (with prices)
   GET /dashboard/stats?lang=ar-EG
   ↓
3. CREATE MARKETPLACE LISTING (with price suggestion)
   POST /marketplace/listings?lang=ar-EG
   ↓
4. VIEW LISTINGS (with price comparison)
   GET /marketplace/listings
   ↓
5. CREATE BUSINESS PLAN
   POST /businessPlan/generate?lang=ar-EG
   ↓
6. CHAT WITH AI
   POST /chat (crop planning mode)
```

---

## 🌍 Language Parameter Examples

### English

```
?lang=en
```

### Arabic (Egyptian - Default & Colloquial)

```
?lang=ar
?lang=ar-EG
```

### Arabic (Saudi - Formal)

```
?lang=ar-SA
```

---

## 📝 Common Request Bodies

### Register

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

### Login

```json
{
  "email": "ahmed@farm.com",
  "password": "password123"
}
```

### Create Listing

```json
{
  "title": "Premium Wheat",
  "description": "High quality wheat",
  "crop": "Wheat",
  "quantity": 500,
  "unit": "kg",
  "pricePerUnit": 450,
  "location": "Dakahlia, Egypt"
}
```

### Create Farm

```json
{
  "name": "Ahmed's Farm",
  "location": "Giza, Egypt",
  "area": 50,
  "crops": ["Wheat", "Rice", "Corn"]
}
```

### Generate Business Plan

```json
{
  "crop": "Wheat",
  "area": 50,
  "region": "Giza",
  "lang": "en"
}
```

### Create Harvest Plan

```json
{
  "crop": "Wheat",
  "plantingDate": "2025-10-01",
  "expectedHarvestDate": "2026-05-01",
  "expectedYield": 2500
}
```

### AI Chat

```json
{
  "mode": "planning",
  "message": "كيف أزرع القمح بكفاءة",
  "lang": "ar-EG"
}
```

---

## ✅ Headers Needed

### All Requests (except Register/Login)

```
Authorization: Bearer {{token}}
Content-Type: application/json (for POST/PUT)
Accept-Language: en (or ar-EG, ar-SA)
```

---

## 🎯 Test the New Features

### Feature 1: Crop Prices from Mahsoly

```
GET /dashboard/stats
GET /marketplace/listings
→ Response includes cropPrices and priceComparison
```

### Feature 2: Arabic Support

```
GET /dashboard/stats?lang=ar-EG
GET /farm?lang=ar
POST /businessPlan/generate?lang=ar-SA
→ All responses in selected language
```

### Feature 3: Market Price Suggestions

```
POST /marketplace/listings
→ Response includes marketPriceSuggestion from Mahsoly
```

### Feature 4: AI in Arabic

```
POST /businessPlan/generate?lang=ar-EG
POST /chat?lang=ar-EG
→ AI responses in Arabic
```

---

## 🔍 Verify Response Structure

### Marketplace Listing Response

✅ Has: `suggestedPrice`
✅ Has: `marketPriceSuggestion`

### Marketplace Listings Response

✅ Has: `priceComparison` with:

- listingPrice
- marketPrice
- marketCurrency
- source

### Dashboard Response

✅ Has: `cropPrices` array
✅ Has: `pricesSource`
✅ Has: `pricesLastUpdated`

---

## 🐛 Troubleshooting

| Issue                  | Solution                                   |
| ---------------------- | ------------------------------------------ |
| "No token" error       | Get token from Login, paste to environment |
| 404 Not Found          | Check endpoint URL spelling                |
| CORS error             | Ensure server runs on port 3000            |
| Arabic not showing     | Check UTF-8 encoding in tool settings      |
| Mahsoly prices missing | Verify Mahsoly API is accessible           |

---

## 📞 Help

### Check if working:

1. Register user
2. Login (get token)
3. GET /dashboard/stats
4. Should see all data + crop prices

### Debug API response:

- Check response body for error details
- Look at response status code
- Read error message in response

### View server logs:

- Terminal where `node server.js` runs
- Look for console.log() outputs
- Check for any error messages

---

## 📊 Expected Response Statuses

| Endpoint      | Success | Error             |
| ------------- | ------- | ----------------- |
| Register      | 201     | 400 (validation)  |
| Login         | 200     | 401 (credentials) |
| GET requests  | 200     | 404 (not found)   |
| POST requests | 201     | 400/500           |

---

## 🎓 Documentation

- **Full Guide**: See `INSOMNIA_COLLECTION_GUIDE.md` or `POSTMAN_UPDATED_COLLECTION.md`
- **Arabic Guide**: See `ARABIC_LOCALIZATION_GUIDE.md`
- **Prices Guide**: See `MAHSOLY_PRICES_INTEGRATION.md`
- **Full Collections**: See `API_COLLECTIONS_GUIDE.md`

---

## 🚀 Ready to Test?

1. ✅ Import collection (Insomnia or Postman)
2. ✅ Set environment variables
3. ✅ Run Login request
4. ✅ Copy token to environment
5. ✅ Start testing endpoints!

**You're all set! Happy testing! 🎉**
