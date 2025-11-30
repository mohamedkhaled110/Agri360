# Quick Testing Checklist

## 🟢 Server Status

- [x] Server is running on port 5000
- [x] MongoDB is connected
- [x] No startup errors

## 🟡 To Test Now (In Postman)

### Step 1: Authentication

- [ ] POST `/api/auth/register` - Create account
  - Body: `{ "name": "Test", "email": "test@example.com", "password": "pass123" }`
  - Check response contains: `token`
- [ ] Copy token to Postman Environment variable `{{token}}`

### Step 2: Business Plan Endpoint (MAIN FIX)

- [ ] POST `/api/businessPlan/?lang=ar-EG`
  - Headers: `Authorization: Bearer {{token}}`
  - Body:
    ```json
    {
      "farm": {
        "name": "Test Farm",
        "fieldSizeHectares": 20,
        "location": {
          "lat": 30.0444,
          "lon": 31.2357
        }
      },
      "crop": "wheat",
      "lang": "ar-EG"
    }
    ```
  - **Expected:** ✅ 201 Created with business plan
  - **Check:** Response should have `businessPlan._id`, `aiAdvice`, `profitMargin`, etc.

### Step 3: Chat Endpoint

- [ ] POST `/api/chat/`
  - Headers: `Authorization: Bearer {{token}}`
  - Body: `{ "message": "What is agriculture?", "lang": "en" }`
  - **Expected:** ✅ 200 OK with `reply` field

### Step 4: Simple Plan Endpoint

- [ ] POST `/api/simple/`
  - Headers: `Authorization: Bearer {{token}}`
  - Body: `{ "crop": "wheat", "lang": "en" }`
  - **Expected:** ✅ 200 OK with AI response

### Step 5: Arabic Support

- [ ] Repeat Step 2 with `"lang": "ar-EG"`
  - **Expected:** ✅ Response in Arabic

### Step 6: Dashboard Stats (Existing Feature)

- [ ] GET `/api/dashboard/stats?lang=ar-EG`
  - Headers: `Authorization: Bearer {{token}}`
  - **Expected:** ✅ Dashboard data in Arabic

---

## 🔴 If You See Errors

### Error: 500 Internal Server Error

- [ ] Check server console for ERROR messages
- [ ] Look for: "ERROR: [service name] failed: ..."
- [ ] Report the specific ERROR message

### Error: 401 Unauthorized

- [ ] Token missing or invalid
- [ ] Re-login and copy new token

### Error: 404 Not Found

- [ ] Endpoint path is wrong
- [ ] Check `/api/` prefix is included

### Error: Cannot POST ...

- [ ] Server might not be running
- [ ] Run `npm start` again

---

## 📊 Test Results Template

When reporting results, include:

```
✅ Server Status: [Running/Error]
✅ Business Plan Endpoint: [Working/Error]
   Response Code: [200/201/500]
   Response Preview: [first 100 chars]

✅ Chat Endpoint: [Working/Error]
   Response Code: [200/500]

✅ Simple Plan: [Working/Error]
   Response Code: [200/500]

✅ Arabic Support: [Working/Error]
   Language: ar-EG
   Response has Arabic text: [Yes/No]

Console Errors: [None/List any ERROR messages]
```

---

## 🎯 Success Criteria

- ✅ No 500 errors on business plan endpoint
- ✅ Business plan response includes: `businessPlan._id`, `aiAdvice`, `profitMargin`
- ✅ Chat responds with AI text
- ✅ Arabic requests return Arabic responses
- ✅ All endpoints return proper HTTP status codes

---

## 📝 Notes

- Business plan may take 5-15 seconds (external AI API call)
- Simple plan should be faster (no data aggregation)
- Set Postman timeout to 30 seconds for longer endpoints
- Check server console while testing for detailed logs
