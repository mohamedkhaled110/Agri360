# 🚀 VS CODE REST CLIENT TESTING GUIDE

## ✅ What's Ready

1. **`test-api.http`** file created - Ready to test all APIs
2. **REST Client extension** installed - Ready to send requests
3. **17 test endpoints** configured - All Mahsoly features included

---

## 🎯 Quick Start

### Step 1: Open the test file

```
Open: d:\Agri360 backend\test-api.http
```

### Step 2: Make sure server is running

```bash
npm run dev
# Should show:
# ✅ Server running on port 5000
# ✅ Connected to MongoDB
```

### Step 3: Test Authentication

Look for this request in `test-api.http`:

```
### 1️⃣ REGISTER NEW USER
POST {{baseUrl}}/auth/register
```

Click **"Send Request"** button that appears above it (or Ctrl+Alt+R)

### Step 4: Copy Token

Response will show on the right side:

```json
{
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Copy the token value

### Step 5: Set Token in File

At the top of `test-api.http`, find:

```
@token =
```

Paste the token:

```
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⭐ MAHSOLY Testing (What You Want!)

### Test 1: Business Plan with Mahsoly Data

```
### 4️⃣ CREATE BUSINESS PLAN ⭐ (MAHSOLY MARKET DATA INCLUDED)
```

1. Click this section
2. Click **"Send Request"** button
3. Response shows on right panel
4. **Look for this in response:**

```json
"mahsolyData": {
  "source": "mahsoly-api",
  "marketData": {
    "endpoint": "/stockmarket",
    "prices": [...] ← REAL MARKET PRICES
  },
  "itemsData": {
    "endpoint": "/item/all",
    "items": [...] ← CROP ITEMS
  },
  "farmsData": {
    "endpoint": "/farm/all",
    "farms": [...] ← FARM TYPES
  }
}
```

✅ **This confirms Mahsoly working!**

---

### Test 2: Dashboard with Mahsoly Market Trends

```
### 🔟 COMPUTE DASHBOARD STATS ⭐ (MAHSOLY MARKET DATA INCLUDED)
```

1. Click this section
2. Click **"Send Request"** button
3. Response shows on right panel
4. **Look for this in response:**

```json
"cropPriceTrends": {
  "source": "mahsoly-api",
  "marketData": {
    "prices": [...] ← MARKET PRICES
  },
  "itemsData": {
    "items": [...] ← AVAILABLE ITEMS
  },
  "farmsData": {
    "farms": [...] ← AVAILABLE FARMS
  }
}
```

✅ **This confirms Dashboard + Mahsoly working!**

---

## 📋 All 17 Endpoints Available

| #      | Endpoint                    | Method   | Mahsoly? |
| ------ | --------------------------- | -------- | -------- |
| 1      | Register                    | POST     | -        |
| 2      | Login                       | POST     | -        |
| 3      | Get User                    | GET      | -        |
| **4**  | **Create Business Plan** ⭐ | **POST** | **✅**   |
| 5      | List Plans                  | GET      | -        |
| 6      | Get Plan by ID              | GET      | -        |
| 7      | Update Plan                 | PUT      | -        |
| 8      | Delete Plan                 | DELETE   | -        |
| 9      | Get Dashboard               | GET      | -        |
| **10** | **Compute Dashboard** ⭐    | **POST** | **✅**   |
| 11     | Create Harvest              | POST     | -        |
| 12     | List Harvest                | GET      | -        |
| 13     | Create Marketplace          | POST     | -        |
| 14     | List Marketplace            | GET      | -        |
| 15     | Create Farm                 | POST     | -        |
| 16     | List Farms                  | GET      | -        |
| 17     | Get Farm by ID              | GET      | -        |

---

## 🔧 How to Use REST Client in VS Code

### Sending Requests

1. **Click on request line** (any line in the request block)
2. **Look for "Send Request" link** that appears above
3. **Click it** or press **Ctrl+Alt+R**
4. **Response appears on right panel**

### Example:

```http
### My Test Request
POST http://localhost:5000/api/test
Content-Type: application/json

{
  "data": "value"
}
```

When you click Send Request:

- Left panel: Your request
- Right panel: Response with status code

### Using Variables

```http
@baseUrl = http://localhost:5000/api
@token = your_token_here

POST {{baseUrl}}/endpoint
Authorization: Bearer {{token}}
```

Variables are replaced automatically!

---

## 🧪 Complete Testing Workflow

### Workflow 1: Test Mahsoly Market Data

```
1. REGISTER or LOGIN
   ↓
2. Copy token → Set @token
   ↓
3. CREATE BUSINESS PLAN ⭐
   ↓
4. Check response → mahsolyData section
   ↓
5. Confirm: Stock prices + items + farms visible
```

### Workflow 2: Test Dashboard with Market

```
1. REGISTER or LOGIN
   ↓
2. Copy token → Set @token
   ↓
3. COMPUTE DASHBOARD ⭐
   ↓
4. Check response → cropPriceTrends section
   ↓
5. Confirm: Market prices + items + farms visible
```

---

## 🎨 VS Code UI Features

### Response Panel

- **Status code** shown in header (200, 201, 400, 500, etc.)
- **Response time** shown
- **Syntax highlighting** for JSON/XML
- **Pretty print** automatic
- **Tab for headers** view
- **Tab for cookies** view

### Request Panel

- **Syntax highlighting**
- **Auto-complete** for variables
- **Line numbers**
- **Send Request** button above request

### Variables Section

- Edit variables at top
- All {{variable}} auto-replaced
- Changes apply to all requests

---

## 🚨 Common Issues & Fixes

### Issue: "Cannot connect to server"

**Fix**: Make sure server running

```bash
npm run dev
# Terminal should show: ✅ Server running on port 5000
```

### Issue: "401 Unauthorized"

**Fix**: Token not set or expired

```
1. Run REGISTER or LOGIN
2. Copy token from response
3. Paste in: @token = TOKEN_HERE
```

### Issue: "500 Server Error"

**Fix**: Check server logs in terminal

- Server might have crashed
- Run: `npm run dev` again
- Check `.env` file has all variables

### Issue: Mahsoly data not in response

**Fix**: Mahsoly API might be unreachable

- System uses fallback mock data
- Still returns valid response
- Check server logs for warnings

---

## 💡 Pro Tips

### Tip 1: Save Responses

Click **"Save"** button in response panel to save response to file

### Tip 2: Copy Request as cURL

Right-click request → "Copy Request as cURL"
Useful for terminal testing

### Tip 3: Use Environment

VS Code extension supports `.env` files
Variables auto-loaded from `@baseUrl = ...` syntax

### Tip 4: Multiple Tokens

Create multiple @token variables:

```
@token = token1
@token2 = token2
```

Use: `Authorization: Bearer {{token}}` or `{{token2}}`

### Tip 5: Test Chain

Run requests in order:

1. Login → Save token
2. Create Business Plan → Save plan ID
3. Get Plan by ID → Use saved ID

---

## 📱 File Location

```
d:\Agri360 backend\test-api.http
```

Just open this file and start testing!

---

## 🎯 Success Indicators

✅ When working correctly:

- Requests send without error
- Responses show 200/201 status
- Mahsoly data visible in responses
- Token persists across requests
- No "Connection refused" errors

---

## 🆘 Need Help?

### Check Server Status

```bash
# Terminal
npm run dev

# Should output:
# ✅ Connected to MongoDB successfully
# ✅ Server running on port 5000
```

### Check Mahsoly Integration

Run "CREATE BUSINESS PLAN" request → response should include mahsolyData

### Check Token

Run "GET CURRENT USER" request → should work without error

---

**Ready to test?** 🚀

1. Open `test-api.http`
2. Make sure `npm run dev` is running
3. Click "Send Request" on any endpoint
4. Watch responses appear on right panel!
