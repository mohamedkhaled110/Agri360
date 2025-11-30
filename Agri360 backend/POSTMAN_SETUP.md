# Postman Setup Guide for Agri360 API

## Quick Setup (5 minutes)

### Step 1: Import the Environment

1. Open **Postman**
2. Click **Environments** (left sidebar)
3. Click **Import**
4. Select: `Agri360_Postman_Environment.json`
5. After import, **activate it** by clicking on the environment name in the top-right dropdown

### Step 2: Import the Collection

1. In Postman, click **Collections** (left sidebar)
2. Click **Import**
3. Select: `Agri360_Postman_Collection.json`

### Step 3: Verify baseUrl

- Make sure the environment variable `baseUrl` is set to `http://localhost:5000`
- If your server is on a different port, update it:
  - Click the environment name (top-right) → **Edit**
  - Find `baseUrl` and update the value
  - Click **Save**

---

## How to Test (Token Auto-Population)

### 1. Register a New Farmer

1. In the collection, expand **🔐 Authentication**
2. Click **Register New Farmer**
3. Click **Send**
4. If successful (201), the test script automatically extracts and saves the `token` and `farmerId`
5. The token is now available to all other requests

### 2. Test a Protected Endpoint

1. Expand **📊 Dashboard**
2. Click **Dashboard Stats (English)**
3. Click **Send**
4. **Should return 200** (not 401 Unauthorized)
5. The `Authorization: Bearer {{token}}` header is automatically added

### 3. Test Other Endpoints

- **Marketplace, Farm, Business Plan, Harvest Plan, Chat** all use the same token
- Run **Register** first to populate the token
- Then test any other endpoint

---

## Troubleshooting

### Issue: "Unauthorized" (401) response

**Solution 1: Check if environment is active**

- Top-right corner of Postman, click the environment dropdown
- Make sure **"Agri360 Local Development"** is selected (highlighted in orange)

**Solution 2: Verify token was set after Register**

1. Run **Register New Farmer** again
2. In the response, check if you see `"token": "eyJ..."` (should be a long string)
3. Click the **Environment** tab (right sidebar)
4. Check if `token` variable has a value (should be a long JWT string)
5. If empty, the test script didn't extract it correctly

**Solution 3: Manual token entry**

1. Run **Register New Farmer** and copy the `token` from the response
2. Click the **Environment** tab (right sidebar)
3. Find the `token` variable and paste the token value into **Current value**
4. Now test other endpoints

### Issue: "Invalid credentials" (401) on Login

- Verify the email/password in the **Login** request body match the registered account
- Default: `email: "ahmed@farm.com"`, `password: "password123"`

### Issue: 404 on any endpoint

- Check that `baseUrl` is `http://localhost:5000`
- Verify the server is running: `npm run dev`
- Confirm server logs show "✅ Server running on port 5000"

---

## Token Behavior

- **Tokens do NOT expire** (removed 7-day limit)
- **One token works forever** until you register/login again or the server restarts
- After registration/login, the token is automatically saved to the environment variable `{{token}}`
- All protected endpoints use `Authorization: Bearer {{token}}` header

---

## What's in the Collection

- **🔐 Authentication**: Register, Login, Get Current User (+ auto token capture)
- **📊 Dashboard**: Get stats in English, Arabic-EG, Arabic-SA (with Mahsoly prices)
- **🏪 Marketplace**: List & create listings with price suggestions
- **🌾 Farm Management**: Create & list farms (supports Arabic)
- **📋 Business Plan**: Generate plans (AI service, supports Arabic)
- **🌱 Harvest Plan**: Create harvest plans (supports Arabic)
- **🤖 AI Chat Services**: Chat & planning (responds in Arabic)

All requests include **Postman tests** that validate:

- Response status codes (200, 201, 404, etc.)
- JSON structure (presence of expected fields)
- Arabic language detection (for Arabic requests)
- Mahsoly price data (when available)

---

## Server Commands

Start the server (if not already running):

```powershell
npm run dev
```

Expected output:

```
✅ Connected to GeminiDB / MongoDB successfully
✅ Server running on port 5000
```

Stop the server:

```powershell
Ctrl+C
```

Kill leftover node processes:

```powershell
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object { $_.Kill() }
```

---

## API Endpoints Summary

| Method | Endpoint               | Auth | Language                         |
| ------ | ---------------------- | ---- | -------------------------------- |
| POST   | `/api/auth/register`   | None | ✅ lang param                    |
| POST   | `/api/auth/login`      | None | ✅ lang param                    |
| GET    | `/api/auth/me`         | Yes  | ✅ lang param                    |
| GET    | `/api/dashboard`       | Yes  | ✅ lang param                    |
| GET    | `/api/market/listings` | No   | ✅ lang param                    |
| POST   | `/api/market/listings` | Yes  | ✅ lang param                    |
| POST   | `/api/farms`           | Yes  | ✅ lang param                    |
| GET    | `/api/farms`           | Yes  | ✅ lang param                    |
| POST   | `/api/business`        | Yes  | ✅ lang param                    |
| POST   | `/api/harvests`        | Yes  | ✅ lang param                    |
| POST   | `/api/chat`            | Yes  | ✅ lang param (ar-EG, ar-SA, en) |

---

## Language Support

All endpoints accept `?lang=` query parameter or send via request body:

- `lang=en` → English responses
- `lang=ar-EG` → Egyptian Arabic (default for Arabic)
- `lang=ar-SA` → Saudi Arabic
- `lang=ar` → Falls back to ar-EG

AI services (chat, business plan, harvest plan) respond in the specified language.

---

## Example Flow

1. **Register**: `POST /api/auth/register` → get `token`
2. **Dashboard**: `GET /api/dashboard` with `Bearer {{token}}`
3. **Create Farm**: `POST /api/farms` with farm data + token
4. **Chat**: `POST /api/chat` with message + token → AI responds in Arabic
5. **Marketplace**: `POST /api/market/listings` → get Mahsoly price suggestions

Enjoy testing! 🚀
