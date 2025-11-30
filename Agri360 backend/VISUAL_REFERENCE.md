# 📺 VISUAL REFERENCE - What You'll See

## 🖥️ When You Open test-api.http

```
┌─────────────────────────────────────────────────────────────────┐
│ File: test-api.http                    ✕ test-api.http        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  @baseUrl = http://localhost:5000/api                          │
│  @server = http://localhost:5000                               │
│  @token =                                                       │
│                                                                 │
│  ### ================================================================  │
│  ### 🔐 AUTHENTICATION ENDPOINTS                               │
│  ### ================================================================  │
│                                                                 │
│  ### 1️⃣ REGISTER NEW USER                                      │
│  ▶ Send Request                                                │
│  POST {{baseUrl}}/auth/register                                │
│  Content-Type: application/json                                │
│                                                                 │
│  {                                                              │
│    "name": "Ahmed Farmer",                                     │
│    "email": "ahmed@farm.com",                                  │
│    "password": "password123",                                  │
│    "role": "farmer",                                           │
│    "country": "Egypt",                                         │
│    "governorate": "Giza"                                       │
│  }                                                              │
│                                                                 │
│  ### 2️⃣ LOGIN                                                  │
│  ▶ Send Request                                                │
│  ...                                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 When You Click "Send Request"

### Before Click

```
### 1️⃣ REGISTER NEW USER
▶ Send Request    ← Click here!
POST {{baseUrl}}/auth/register
```

### After Click - Response Appears

```
┌──────────────────────────────────────┬──────────────────────────────────────┐
│ REQUEST                              │ RESPONSE                             │
├──────────────────────────────────────┼──────────────────────────────────────┤
│                                      │                                      │
│ ### 1️⃣ REGISTER NEW USER            │ 201 Created 342ms                    │
│                                      │                                      │
│ POST /api/auth/register              │ {                                    │
│ Content-Type: application/json       │   "user": {                          │
│                                      │     "_id": "507f1f77bcf8...",        │
│ {                                    │     "name": "Ahmed Farmer",          │
│   "name": "Ahmed Farmer",            │     "email": "ahmed@farm.com",       │
│   "email": "ahmed@farm.com",         │     "role": "farmer"                 │
│   "password": "password123",         │   },                                 │
│   "role": "farmer",                  │   "token": "eyJhbGciOiJIUzI..."     │
│   "country": "Egypt",                │ }                                    │
│   "governorate": "Giza"              │                                      │
│ }                                    │ [▼ Pretty] [Raw] [Clear]             │
│                                      │                                      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 📋 Setting Token in File

### Before (Empty Token)

```http
@baseUrl = http://localhost:5000/api
@server = http://localhost:5000
@token =
```

### After (With Token)

```http
@baseUrl = http://localhost:5000/api
@server = http://localhost:5000
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YjMyM2M2ZjQ2ZDJjMDAxYWJjZGVmMSIsInJvbGUiOiJmYXJtZXIiLCJlbWFpbCI6ImFobWVkQGZhcm0uY29tIn0.aBcD1234efGhIjKlmNoPqRsTuVwXyZ
```

---

## ⭐ Mahsoly Test - Create Business Plan

### Request You Send

```
### 4️⃣ CREATE BUSINESS PLAN ⭐ (MAHSOLY MARKET DATA INCLUDED)
POST {{baseUrl}}/business
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "farm": {
    "_id": "farm_123",
    "farmName": "Green Valley Farm",
    "fieldSizeHectares": 5,
    "location": {
      "lat": 30.0444,
      "lon": 31.2357
    }
  },
  "crop": "wheat",
  "cropCode": 56,
  "investmentCost": 5000,
  "duration": 120,
  "expectedYield": 15
}
```

### Response You Get (Partial - Mahsoly Section)

```json
{
  "businessPlan": {
    "_id": "507f191e810c19729de860ea",
    "crop": "wheat",
    "investmentCost": 5000,

    "mahsolyData": {                          ← THIS IS MAHSOLY!
      "source": "mahsoly-api",
      "timestamp": "2025-11-15T10:30:00Z",
      "marketData": {
        "endpoint": "/stockmarket",
        "count": 50,
        "prices": [
          {
            "date": "2025-11-15",
            "price": 250,
            "currency": "EGP"                ← MARKET PRICE
          },
          {
            "date": "2025-11-14",
            "price": 248,
            "currency": "EGP"
          }
        ]
      },
      "itemsData": {
        "endpoint": "/item/all",
        "items": [
          "Wheat Grade A",                   ← CROP ITEMS
          "Wheat Grade B",
          "Wheat Grade C"
        ]
      },
      "farmsData": {
        "endpoint": "/farm/all",
        "farms": [
          "Farm Type 1",                     ← FARM TYPES
          "Farm Type 2"
        ]
      }
    },

    "aiGeneratedPlan": {
      "executive_summary": "...",
      "market_analysis": {
        "current_price": "₹250 EGP (from Mahsoly)"
      }
    }
  }
}
```

✅ **This shows Mahsoly working!**

---

## 📊 Dashboard Test - Compute Dashboard

### Response You Get (Mahsoly Section)

```json
{
  "stats": {
    "_id": "stat_789",
    "crop": "wheat",

    "cropPriceTrends": {                      ← MAHSOLY DATA!
      "source": "mahsoly-api",
      "timestamp": "2025-11-15T10:35:00Z",
      "marketData": {
        "endpoint": "/stockmarket",
        "count": 50,
        "prices": [
          {
            "date": "2025-11-15",
            "price": 250,
            "currency": "EGP"               ← MARKET PRICES
          }
        ]
      },
      "itemsData": {
        "endpoint": "/item/all",
        "items": [
          "Wheat Grade A"                  ← ITEMS AVAILABLE
        ]
      },
      "farmsData": {
        "endpoint": "/farm/all",
        "farms": [
          "Farm Type 1"                    ← FARM TYPES
        ]
      }
    },

    "riskScore": 38,
    "alerts": [
      "Mahsoly market prices rising by 5% this week",  ← MARKET ALERT
      "Rainfall expected in 2 days"
    ]
  }
}
```

✅ **Dashboard shows Mahsoly data!**

---

## 🎨 Color Indicators in VS Code

### Status Codes

```
200 OK           → Green ✅
201 Created      → Green ✅
400 Bad Request  → Red ❌
401 Unauthorized → Red ❌  (Set @token first!)
500 Server Error → Red ❌  (Check server)
```

### Response Time

```
< 1 second    → Fast ⚡
1-3 seconds   → Normal ✅
3-5 seconds   → Slow (AI generating)
> 5 seconds   → Very slow ⚠️
```

---

## 📍 File Locations

```
d:\Agri360 backend\
├── test-api.http                          ← MAIN FILE TO OPEN
├── VSCODE_REST_CLIENT_GUIDE.md             ← HOW-TO GUIDE
├── STEP_BY_STEP_TESTING.md                 ← DETAILED STEPS
├── QUICK_START_GUIDE.md                    ← OVERVIEW
├── README_TESTING.md                       ← START HERE
├── TESTING_OPTIONS.md                      ← ALL OPTIONS
├── MAHSOLY_VERIFICATION_REPORT.md          ← DETAILS
├── POSTMAN_API_COLLECTION.md               ← API REFERENCE
└── Agri360_Postman_Collection.json         ← FOR POSTMAN
```

---

## 🎯 Navigation in REST Client

### Scrolling Through Requests

```
Use arrow keys or scroll to navigate
Each request starts with ###
```

### Finding Requests

```
Ctrl+F → Search for "MAHSOLY" or "BUSINESS"
→ Jumps to that section
```

### Expanding JSON in Response

```
Click ▶ arrow to expand sections
Click ▼ arrow to collapse sections
```

---

## ⌨️ Keyboard Shortcuts Summary

```
Ctrl+Alt+R     → Send Request
Ctrl+F         → Find in file
Ctrl+C         → Copy selected text
Ctrl+Z         → Undo
Escape         → Close response panel
Ctrl+Shift+P   → Command palette
```

---

## 🔄 Full Testing Workflow Visual

```
START
 ↓
[1] REGISTER
 ├─ Response: { "token": "..." }
 ↓
[2] Copy token from response
 ↓
[3] Paste at top: @token = TOKEN_HERE
 ↓
[4] CREATE BUSINESS PLAN ⭐
 ├─ Response: { "mahsolyData": {...} }
 ├─ See: Market prices ✅
 ├─ See: Crop items ✅
 ├─ See: Farm types ✅
 ↓
[5] COMPUTE DASHBOARD ⭐
 ├─ Response: { "cropPriceTrends": {...} }
 ├─ See: Market trends ✅
 ├─ See: Alerts ✅
 ↓
[6] GET BUSINESS PLAN by ID
 ├─ Verify: Mahsoly data persisted ✅
 ↓
[7] CREATE FARM
 ↓
[8] CREATE HARVEST
 ↓
[9] CREATE MARKETPLACE
 ↓
SUCCESS! ✅
All features tested and working!
```

Time: ~30 minutes

---

## 💡 Pro Tips

### Tip 1: Hide Request, Show Response

```
Click small arrow [ < ] on response panel
Makes response take full width
```

### Tip 2: Compare Responses

```
Send same request twice
Click ← → arrows to compare
Useful for debugging
```

### Tip 3: Copy Full Response

```
In response panel top-right
Click "Copy" button
Paste in text editor to save
```

### Tip 4: Split Screen

```
You can have:
- test-api.http on LEFT
- Terminal on RIGHT showing logs
- Response panel floating
```

### Tip 5: Multiple Files

```
Open multiple .http files
Test different endpoints
Keep API.http open as reference
```

---

## 🎓 Example: Real Testing Session

```
TIME: 9:00 AM
────────────────────────────

9:00 - Open test-api.http
9:01 - Send REGISTER request
9:02 - Copy token
9:03 - Set @token in file
9:04 - Send CREATE BUSINESS PLAN
       → See mahsolyData ✅
9:07 - Send COMPUTE DASHBOARD
       → See cropPriceTrends ✅
9:10 - Send GET PLAN by ID
       → Verify persistence ✅
9:12 - Send CREATE FARM
9:14 - Send CREATE HARVEST
9:16 - Send CREATE MARKETPLACE
9:18 - All tests complete! ✅

TOTAL TIME: 18 minutes
All Mahsoly features verified!
```

---

## ✨ UI Elements You'll See

### Send Request Link

```
▶ Send Request    ← Blue, clickable link
```

### Request Section

```
### 1️⃣ REGISTER NEW USER
POST {{baseUrl}}/auth/register
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Response Status

```
201 Created 342ms      ← Status and time
```

### Response Body

```
{
  "user": {...},       ← Click to expand
  "token": "..."
}
```

### Pretty Print Button

```
[Pretty] [Raw] [Clear]  ← Format options
```

---

## 🎉 When Everything Works

### You'll See:

```
✅ Status: 201 Created (green)
✅ Response time: < 2 seconds
✅ mahsolyData: Present in response
✅ Market prices: Visible in marketData
✅ Crop items: Visible in itemsData
✅ Farm types: Visible in farmsData
✅ AI plan: Generated using market data
✅ No errors: Response body has no "error" field
```

---

## 🚨 Common Issues & Visual Signs

### Issue: "Cannot connect to server"

```
Error shown:
{
  "error": "ECONNREFUSED - Connection refused"
}
Fix: Run npm run dev
```

### Issue: "401 Unauthorized"

```
Error shown:
{
  "message": "No token, authorization denied"
}
Fix: Set @token = YOUR_TOKEN
```

### Issue: "500 Server Error"

```
Error shown:
{
  "message": "Server error"
}
Fix: Check terminal logs for details
```

---

**Now you know what to expect!** 👀  
**Open test-api.http and start testing!** 🚀
