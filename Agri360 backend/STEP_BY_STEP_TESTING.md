# 📱 STEP-BY-STEP: Testing with VS Code REST Client

## ✅ Prerequisites Checklist

- [ ] Server running: `npm run dev`
- [ ] MongoDB connected
- [ ] REST Client extension installed ✅
- [ ] `test-api.http` file ready ✅

---

> ملاحظة: يدعم النظام اللغة العربية — يمكنك إرسال `?lang=ar` أو وضع ترويسة `Accept-Language: ar` أو تضمين `"lang":"ar"` في بيانات التسجيل للحصول على رسائل واستجابات عربية.

## 🎯 STEP 1: Open test-api.http

**Action**:

1. In VS Code file explorer
2. Open: `d:\Agri360 backend\test-api.http`

**What you see**:

```
File opens with 17 test requests
Each request labeled with emoji (🔐, 🌾, 📊, etc.)
```

---

## 🔐 STEP 2: Register or Login

### Option A: Register New User

**Find this section:**

```
### 1️⃣ REGISTER NEW USER
# Save the token from response and set @token = TOKEN_VALUE above
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "name": "Ahmed Farmer",
  "email": "ahmed@farm.com",
  "password": "password123",
  ...
}
```

**How to run:**

1. Click anywhere on this request block
2. **"Send Request"** link appears above
3. Click it (or press Ctrl+Alt+R)

**What happens:**

- Request sent to: `http://localhost:5000/api/auth/register`
- Response appears on RIGHT panel
- Shows status: `201 Created`

**ملاحظة بالعربية:** عند إضافة `?lang=ar` أو ترويسة `Accept-Language: ar` ستظهر رسائل الخطأ والنجاح باللغة العربية.

**Response you get:**

```json
{
  "user": {
    "_id": "user_123",
    "name": "Ahmed Farmer",
    "email": "ahmed@farm.com",
    "role": "farmer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YjMyM..."
}
```

---

## 🔑 STEP 3: Copy and Set Token

**Find token in response:**
Look in the right panel response:

```
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Copy it** (click and copy full token string)

**Paste at top of file:**

```
@baseUrl = http://localhost:5000/api
@server = http://localhost:5000
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Result**: All future requests will use this token automatically!

---

## ⭐ STEP 4: Test Mahsoly - Create Business Plan

**Find this:**

```
### 4️⃣ CREATE BUSINESS PLAN ⭐ (MAHSOLY MARKET DATA INCLUDED)
# This endpoint uses Mahsoly API to get:
# - Stock market prices (/stockmarket)
# - Crop items (/item/all)
# - Farm types (/farm/all)
```

**Run the request:**

1. Click on the request block
2. Click **"Send Request"**
3. Wait ~3-5 seconds (AI is generating plan + Mahsoly fetching data)

**Response on RIGHT panel (look for):**

```json
{
  "businessPlan": {
    "_id": "plan_xyz",
    "crop": "wheat",
    "aiGeneratedPlan": {
      "executive_summary": "...",
      "market_analysis": {...},
      "profitability_analysis": {...}
    },
    "mahsolyData": {                    ← ⭐ THIS PART!
      "source": "mahsoly-api",
      "timestamp": "2025-11-15T10:30:00Z",
      "marketData": {
        "endpoint": "/stockmarket",
        "count": 50,
        "prices": [
          {
            "date": "2025-11-15",
            "price": 250,
            "currency": "EGP"
          },
          ...
        ]
      },
      "itemsData": {                   ← CROP ITEMS
        "endpoint": "/item/all",
        "items": ["Wheat Grade A", "Wheat Grade B", ...]
      },
      "farmsData": {                   ← FARM TYPES
        "endpoint": "/farm/all",
        "farms": ["Farm Type 1", "Farm Type 2", ...]
      }
    }
  }
}
```

✅ **SUCCESS**: You see mahsolyData = Mahsoly API working!

---

## 📊 STEP 5: Test Dashboard - Get Market Trends

**Find this:**

```
### 🔟 COMPUTE DASHBOARD STATS ⭐ (MAHSOLY MARKET DATA INCLUDED)
# This endpoint calls Mahsoly API in real-time
```

**Run the request:**

1. Click on this block
2. Click **"Send Request"**
3. Wait for response

**Response (look for this):**

```json
{
  "stats": {
    "_id": "stat_789",
    "crop": "wheat",
    "cropPriceTrends": {                ← ⭐ MAHSOLY DATA HERE!
      "source": "mahsoly-api",
      "timestamp": "2025-11-15T10:35:00Z",
      "marketData": {
        "endpoint": "/stockmarket",
        "count": 50,
        "prices": [
          {"date": "2025-11-15", "price": 250, "currency": "EGP"},
          {"date": "2025-11-14", "price": 248, "currency": "EGP"}
        ]
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
    "riskScore": 38,
    "alerts": [
      "Mahsoly market prices rising by 5% this week",
      "Rainfall expected in 2 days",
      "Oil prices stable"
    ]
  }
}
```

✅ **SUCCESS**: Dashboard shows Mahsoly market data + alerts!

---

## 🧪 STEP 6: Test Other Features

### Test Harvest Plan

```
### 1️⃣1️⃣ CREATE HARVEST PLAN
```

1. Click request
2. Send request
3. Get harvest plan with AI recommendations

### Test Marketplace

```
### 1️⃣3️⃣ CREATE MARKETPLACE LISTING
```

1. Click request
2. Send request
3. List crop for sale

### Test Farms

```
### 1️⃣5️⃣ CREATE FARM
```

1. Click request
2. Send request
3. Create new farm

---

## 📋 Quick Reference: Request Sections

Each request has this structure:

```
### [NUMBER] [TITLE]
# Comments explaining what it does
[METHOD] [URL]
[HEADERS]
[BLANK LINE]
[BODY - JSON]
```

**Methods:**

- `GET` - Retrieve data (no body)
- `POST` - Create data (has body)
- `PUT` - Update data (has body)
- `DELETE` - Delete data (usually no body)

---

## 🎯 Response Panel Features

**Status Code** (top left):

- 200 = Success (GET)
- 201 = Created (POST)
- 204 = No content (DELETE)
- 400 = Bad request
- 401 = Unauthorized (check token)
- 500 = Server error (check logs)

**Response Time** (top right):

- Shows how long request took
- Mahsoly requests usually 700-1000ms

**Tabs**:

- **Response**: Full response body
- **Headers**: Response headers
- **Cookies**: Any cookies set
- **Timeline**: Request timeline
- **Tests**: Test results (if configured)

---

## 🔄 Common Workflow Example

### Scenario: Test Complete Flow

```
STEP 1: LOGIN
  ↓
STEP 2: Copy token → Set @token = TOKEN_HERE
  ↓
STEP 3: CREATE BUSINESS PLAN
  → See mahsolyData in response
  ↓
STEP 4: COPY PLAN ID from response
  → Example: "_id": "507f1f77bcf86cd799439011"
  ↓
STEP 5: GET BUSINESS PLAN BY ID
  → Replace ID in URL
  → Get BUSINESS PLAN/507f1f77bcf86cd799439011
  → Verify mahsolyData persisted
  ↓
STEP 6: COMPUTE DASHBOARD
  → See cropPriceTrends with Mahsoly
  ↓
SUCCESS ✅
```

---

## 🚀 Hot Tips

### Tip 1: Quick Copy-Paste

Response on right panel has copy buttons on each line
Click to copy JSON values

### Tip 2: Expand/Collapse JSON

Click `▶` arrows to expand/collapse JSON sections
Helps navigate large responses

### Tip 3: Pretty Print

JSON automatically formatted (indented nicely)
Click "Raw" tab for raw response

### Tip 4: Search in Response

Ctrl+F while response panel focused
Search for "mahsoly" or "price" to find sections

### Tip 5: Multiple Requests

VS Code keeps all responses in history
Click ⬅️ ➡️ arrows to navigate between recent responses

---

## ✅ Success Checklist

After each test, verify:

- [ ] Status code is 200 or 201
- [ ] Response has no "error" field
- [ ] Response time under 5 seconds
- [ ] For Mahsoly tests: mahsolyData visible
- [ ] No "401 Unauthorized" (token issue)
- [ ] No "500 Server Error" (check logs)

---

## 🆘 Troubleshooting

### Problem: "Cannot connect to server"

```
Solution:
1. Check terminal: npm run dev running?
2. Check output: "✅ Server running on port 5000"?
3. If not: Kill terminal, run npm run dev again
```

### Problem: "401 Unauthorized"

```
Solution:
1. Check @token is set at top of file
2. Run REGISTER or LOGIN again
3. Copy new token
4. Update @token = ...
```

### Problem: No response after clicking Send

```
Solution:
1. Check left side: Is "Send Request" link visible?
2. Try clicking different part of request
3. Try pressing Ctrl+Alt+R shortcut
4. Restart VS Code if stuck
```

### Problem: Mahsoly data not in response

```
Solution:
1. System uses fallback if Mahsoly API down
2. Response still valid, just mocked data
3. Check terminal logs for warnings
4. Usually resolves automatically in few seconds
```

---

## 📞 Debug Commands

If something not working, run in terminal:

```bash
# Check server status
npm run dev

# Should show:
# ✅ Connected to MongoDB successfully
# ✅ Server running on port 5000

# If error, check logs for:
# - ECONNREFUSED (MongoDB not running)
# - Port already in use (change port)
# - Module not found (npm install missing)
```

---

## 🎉 You're Ready!

**Next steps:**

1. ✅ Open `test-api.http`
2. ✅ Make sure `npm run dev` running
3. ✅ Run REGISTER request
4. ✅ Set @token with response token
5. ✅ Run CREATE BUSINESS PLAN
6. ✅ Look for mahsolyData in response
7. ✅ Run COMPUTE DASHBOARD
8. ✅ Look for cropPriceTrends with Mahsoly

**Result**: See real Mahsoly market data in responses! 🚀
