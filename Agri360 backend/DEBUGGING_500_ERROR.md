# Debugging: 500 Error on Business Plan Endpoint

## What You're Seeing

**Request:**

```
POST /api/businessPlan/?lang=ar-EG
Body: {
  "crop": "القمح",
  "area": 50,
  "region": "الجيزة",
  "lang": "ar-EG"
}
```

**Response:**

```
500 Internal Server Error
{ "message": "حدث خطأ في الخادم" }  (Arabic for "Server error")
```

---

## Root Cause: Multiple Service Dependencies

The Business Plan service calls 7 external services in parallel:

```javascript
Promise.all([
  priceService.aggregateMahsolyData(crop),
  forexService.fetchExchangeRate(),
  weatherService.getForecastForFarm(farm),
  faoService.aggregateAgriculturalData(cropCode),
  oilService.fetchOilPrice(),
  soilService.analyzeSoil(farm.soil),
  waterService.estimateWaterNeeds({ crop, areaHectares: ... }),
])
```

If ANY of these fails, the entire request fails.

---

## Likely Issue: Missing `farm` Parameter

Your request body has:

```json
{
  "crop": "القمح",
  "area": 50,
  "region": "الجيزة",
  "lang": "ar-EG"
}
```

But the service expects:

```json
{
  "farm": { ... },  // ← This is missing!
  "crop": "wheat",
  "lang": "ar-EG"
}
```

When `farm` is missing (`undefined`), line 20 tries to call:

```javascript
weatherService.getForecastForFarm(undefined); // ← Will likely fail
```

---

## Fix: Use Correct Request Format

### Option 1: With Farm Object (Recommended)

```json
{
  "farm": {
    "name": "My Farm",
    "fieldSizeHectares": 10,
    "location": "Giza",
    "soil": {
      "type": "clay",
      "pH": 7
    }
  },
  "crop": "wheat",
  "lang": "ar-EG"
}
```

### Option 2: Minimal (Farm Optional)

```json
{
  "crop": "wheat",
  "lang": "ar-EG"
}
```

This will work because services have fallbacks for missing `farm`.

---

## How to Debug

### Step 1: Check Server Console

When you make the request, the server should now show which service failed:

```
ERROR: aggregateMahsolyData failed: [error details]
ERROR: fetchExchangeRate failed: [error details]
ERROR: getForecastForFarm failed: [error details]
... etc
```

### Step 2: Look for the First ERROR Line

That's the culprit. Note the exact error message.

### Step 3: Common Errors and Fixes

| Error                                      | Cause                          | Fix                        |
| ------------------------------------------ | ------------------------------ | -------------------------- |
| `Cannot read property 'fieldSizeHectares'` | farm is undefined              | Add farm object to request |
| `ECONNREFUSED`                             | External API unreachable       | Check internet, firewall   |
| `401 Unauthorized`                         | API key invalid                | Check .env AI_API_KEY      |
| `Cannot read property 'FAO_ITEMS'`         | faoService not imported        | Server restart needed      |
| `undefined is not a function`              | Service not exported correctly | Check service file exports |

---

## Changes Made to Help Debugging

**File:** `services/businessPlan.service.js`

Added error logging to each Promise.all result:

```javascript
const [mahsolyData, fx, weather, faoData, oil, soilAnalysis, waterEst] =
  await Promise.all([
    priceService.aggregateMahsolyData(crop).catch((err) => {
      console.error("ERROR: aggregateMahsolyData failed:", err.message);
      return { error: err.message };
    }),
    forexService.fetchExchangeRate().catch((err) => {
      console.error("ERROR: fetchExchangeRate failed:", err.message);
      return { error: err.message };
    }),
    // ... etc for all 7 services
  ]);
```

Now when something fails, you'll see exactly which service and what the error is.

---

## Testing Steps

### 1. Update Your Postman Request

Change the body to:

```json
{
  "farm": {
    "name": "Test Farm",
    "fieldSizeHectares": 20
  },
  "crop": "wheat",
  "lang": "ar-EG"
}
```

### 2. Watch Server Console

Run:

```bash
npm start
```

### 3. Send Request

Send POST to `/api/businessPlan/?lang=ar-EG` with above body

### 4. Check Console Output

Look for:

- ✅ `Calling AI service for business plan generation...` (Good sign)
- ❌ Any `ERROR: ...` line (This is the culprit)

### 5. Report the Error

If you get an ERROR line, share it and I can fix it.

---

## Immediate Action Items

1. ✅ **Update Postman body** - Include `farm` object
2. ✅ **Restart server** - Run `npm start`
3. ✅ **Watch console** - Look for ERROR messages
4. ✅ **Send request** - Make POST to business plan endpoint
5. ✅ **Report error** - Copy any ERROR messages from console

---

## Files Modified (Today)

- ✅ `services/businessPlan.service.js` - Added try-catch wrapper and error logging for all 7 services

This should make it MUCH easier to diagnose which service is actually failing.
