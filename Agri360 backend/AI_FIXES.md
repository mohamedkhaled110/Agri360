# AI Services Troubleshooting Guide

## Issue: "Server error" from Business Plan and Chat endpoints

### Recent Fixes Applied:

1. **Function Name Mismatch** ✅

   - Controller was calling `generateBusinessPlan()` but service exports `createBusinessPlan()`
   - **Fixed in:** `controllers/businessPlan.controller.js`

2. **Variable Reference Error** ✅

   - AI service functions referenced `client` instead of `aiClient`
   - **Fixed in:** `ai/aiService.js` (all 3 functions)

3. **Missing Language Parameter** ✅

   - Language wasn't being passed through the call chain
   - **Fixed in:** `services/businessPlan.service.js`, `services/aiService.js`

4. **Import Path Error** ✅

   - Chat controller imported directly from `ai/aiService.js` instead of through services layer
   - **Fixed in:** `controllers/chat.controller.js`

5. **Response Parsing** ✅
   - Chat controller was trying to double-parse AI response
   - AI service already extracts the text, controller shouldn't parse again
   - **Fixed in:** `controllers/chat.controller.js`, `services/businessPlan.service.js`

### Testing the Fixes:

#### 1. Start the server:

```bash
npm start
```

Expected output:

```
✅ Connected to GeminiDB / MongoDB successfully
✅ Server running on port 5000
```

#### 2. Test Chat endpoint:

```bash
POST http://localhost:5000/api/chat/
Headers:
  - Authorization: Bearer <your-token>
  - Content-Type: application/json

Body:
{
  "message": "What is the best time to plant wheat?",
  "lang": "en"
}
```

Expected response:

```json
{
  "reply": "The best time to plant wheat is... [AI response]",
  "message": "Chat response received"
}
```

#### 3. Test Business Plan endpoint:

```bash
POST http://localhost:5000/api/businessPlan/
Headers:
  - Authorization: Bearer <your-token>
  - Content-Type: application/json

Body:
{
  "farm": {
    "name": "My Farm",
    "fieldSizeHectares": 10,
    "location": "Egypt"
  },
  "crop": "wheat",
  "lang": "en"
}
```

Expected response:

```json
{
  "businessPlan": {
    "_id": "...",
    "crop": "wheat",
    "aiNotes": "Here is a comprehensive business plan for..."
  },
  "message": "Business plan generated successfully"
}
```

#### 4. Test Arabic Support:

Change `"lang": "en"` to `"lang": "ar-EG"` and the AI should respond in Arabic.

### Debugging Steps:

1. **Check server logs** when making requests:

   - Look for "generateBusinessPlan AI response:" or "chat AI response:"
   - Should show first 200 characters of AI response

2. **Verify AI_API_KEY**:

   ```bash
   grep AI_API_KEY .env
   ```

   - Key must not be empty
   - Key must be valid for the configured API endpoint

3. **Check Network**:

   - AI service makes external HTTP calls to ModelArts API
   - Ensure outbound internet access is available

4. **Review Error Messages**:
   - Terminal will show "generateBusinessPlan error:", "chat error:", etc.
   - These will indicate where the error originated

### Common Error Messages:

| Error                                             | Cause                          | Solution                           |
| ------------------------------------------------- | ------------------------------ | ---------------------------------- |
| "AI_API_KEY not set"                              | Environment variable missing   | Configure AI_API_KEY in .env       |
| "ENOTFOUND api-ap-southeast-1.modelarts-maas.com" | Network/DNS issue              | Check internet connectivity        |
| "401 Unauthorized"                                | Invalid API key                | Verify AI_API_KEY in .env          |
| "Cannot read property 'choices' of undefined"     | Wrong API response format      | Check AI service response handling |
| "ECONNREFUSED"                                    | Server can't connect to AI API | Check firewall/proxy settings      |

### Files Modified:

- ✅ `controllers/businessPlan.controller.js` - Fixed function call
- ✅ `controllers/chat.controller.js` - Fixed import and response parsing
- ✅ `services/businessPlan.service.js` - Added lang parameter and JSON parsing
- ✅ `services/aiService.js` - Added lang parameter to wrapper
- ✅ `ai/aiService.js` - Fixed variable reference and added logging
- ✅ `ai/aiClient.js` - No changes (already correct)

### Next Steps:

1. Start the server: `npm start`
2. Make test requests to `/api/chat/` and `/api/businessPlan/`
3. Monitor terminal output for error messages
4. If still seeing errors, check console logs for AI response details
5. Verify AI_API_KEY and network connectivity

### Performance Note:

AI services make external API calls which can be slow (5-15 seconds). Be patient when testing.
If requests timeout, check network connectivity and API service status.
