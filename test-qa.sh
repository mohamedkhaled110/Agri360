#!/bin/bash

# QA Test Suite for Agri360
# Tests Profile, Notifications, and Marketplace pages
# Date: November 16, 2025

BASE_URL="http://localhost:3000"
API_URL="http://localhost:5000/api"
TEST_EMAIL="ahmed@agri360.test"
TEST_PASSWORD="Agri360@123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
WARNINGS=0

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

# ============================================================================
# 1. AUTHENTICATION TESTS
# ============================================================================

echo -e "\n${BLUE}=== AUTHENTICATION TESTS ===${NC}"

log_test "Login with valid credentials"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    log_fail "Login failed - no token returned"
    echo "Response: $LOGIN_RESPONSE"
else
    log_pass "Login successful - Token: ${TOKEN:0:20}..."
fi

log_test "Get authenticated user profile"
ME_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RESPONSE" | grep -q '"email"'; then
    log_pass "User profile retrieved"
else
    log_fail "Failed to retrieve user profile"
    echo "Response: $ME_RESPONSE"
fi

log_test "Invalid token handling"
INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer invalid.token.here")

HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
    log_pass "Invalid token properly rejected (401)"
else
    log_warn "Invalid token returned $HTTP_CODE instead of 401"
fi

# ============================================================================
# 2. PROFILE PAGE TESTS
# ============================================================================

echo -e "\n${BLUE}=== PROFILE PAGE TESTS ===${NC}"

log_test "GET /api/users/me - Profile endpoint"
PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$PROFILE_RESPONSE" | tail -n2 | head -n1)
RESPONSE_TIME=$(echo "$PROFILE_RESPONSE" | tail -n1)
PROFILE_BODY=$(echo "$PROFILE_RESPONSE" | head -n-2)

if [ "$HTTP_CODE" = "200" ]; then
    log_pass "Profile endpoint returns 200 - Response time: ${RESPONSE_TIME}s"
else
    log_fail "Profile endpoint returned $HTTP_CODE instead of 200"
fi

if echo "$PROFILE_BODY" | grep -q '"name"'; then
    log_pass "Profile contains 'name' field"
else
    log_warn "Profile missing 'name' field"
fi

if echo "$PROFILE_BODY" | grep -q '"email"'; then
    log_pass "Profile contains 'email' field"
else
    log_warn "Profile missing 'email' field"
fi

log_test "Profile data validation"
PROFILE_NAME=$(echo "$PROFILE_BODY" | grep -o '"name":"[^"]*' | cut -d'"' -f4)
PROFILE_EMAIL=$(echo "$PROFILE_BODY" | grep -o '"email":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$PROFILE_NAME" ] && [ ! -z "$PROFILE_EMAIL" ]; then
    log_pass "Profile has valid name ($PROFILE_NAME) and email ($PROFILE_EMAIL)"
else
    log_fail "Profile missing name or email"
fi

log_test "PUT /api/users/me - Update profile"
UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Ahmed Updated\", \"email\": \"$TEST_EMAIL\"}")

UPDATE_HTTP=$(echo "$UPDATE_RESPONSE" | tail -n1)
UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | head -n-1)

if [ "$UPDATE_HTTP" = "200" ] || [ "$UPDATE_HTTP" = "201" ]; then
    log_pass "Profile update returned $UPDATE_HTTP"
else
    log_warn "Profile update returned $UPDATE_HTTP"
fi

# ============================================================================
# 3. MARKETPLACE TESTS
# ============================================================================

echo -e "\n${BLUE}=== MARKETPLACE TESTS ===${NC}"

log_test "GET /api/market/listings - List marketplace items"
MARKET_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/market/listings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

MARKET_HTTP=$(echo "$MARKET_RESPONSE" | tail -n1)
MARKET_BODY=$(echo "$MARKET_RESPONSE" | head -n-1)

if [ "$MARKET_HTTP" = "200" ]; then
    log_pass "Marketplace listings endpoint returns 200"
else
    log_fail "Marketplace listings returned $MARKET_HTTP"
fi

if echo "$MARKET_BODY" | grep -q 'listings\|items'; then
    ITEM_COUNT=$(echo "$MARKET_BODY" | grep -o '"[^"]*"' | wc -l)
    log_pass "Marketplace contains listing data ($ITEM_COUNT items found)"
else
    log_warn "Marketplace response structure unclear"
fi

log_test "POST /api/market/listings - Create listing"
CREATE_LISTING=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/market/listings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "crop": "wheat",
    "quantity": 100,
    "unit": "kg",
    "pricePerUnit": 50,
    "description": "Test listing"
  }')

LISTING_HTTP=$(echo "$CREATE_LISTING" | tail -n1)
LISTING_BODY=$(echo "$CREATE_LISTING" | head -n-1)

if [ "$LISTING_HTTP" = "201" ] || [ "$LISTING_HTTP" = "200" ]; then
    log_pass "Listing creation returned $LISTING_HTTP"
else
    log_fail "Listing creation returned $LISTING_HTTP"
    echo "Response: $LISTING_BODY"
fi

# ============================================================================
# 4. DASHBOARD TESTS
# ============================================================================

echo -e "\n${BLUE}=== DASHBOARD TESTS ===${NC}"

log_test "GET /api/dashboard - Get dashboard stats"
DASH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/dashboard" \
  -H "Authorization: Bearer $TOKEN")

DASH_HTTP=$(echo "$DASH_RESPONSE" | tail -n1)
DASH_BODY=$(echo "$DASH_RESPONSE" | head -n-1)

if [ "$DASH_HTTP" = "200" ]; then
    log_pass "Dashboard endpoint returns 200"
else
    log_fail "Dashboard endpoint returned $DASH_HTTP"
fi

# ============================================================================
# 5. ERROR HANDLING TESTS
# ============================================================================

echo -e "\n${BLUE}=== ERROR HANDLING TESTS ===${NC}"

log_test "Missing Authorization header"
NO_AUTH=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/users/me")
NO_AUTH_HTTP=$(echo "$NO_AUTH" | tail -n1)

if [ "$NO_AUTH_HTTP" = "401" ] || [ "$NO_AUTH_HTTP" = "400" ]; then
    log_pass "Missing auth properly rejected ($NO_AUTH_HTTP)"
else
    log_warn "Missing auth returned $NO_AUTH_HTTP"
fi

log_test "Malformed JSON payload"
BAD_JSON=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{invalid json}')
BAD_JSON_HTTP=$(echo "$BAD_JSON" | tail -n1)

if [ "$BAD_JSON_HTTP" != "200" ]; then
    log_pass "Malformed JSON rejected ($BAD_JSON_HTTP)"
else
    log_warn "Malformed JSON accepted"
fi

# ============================================================================
# 6. EDGE CASES
# ============================================================================

echo -e "\n${BLUE}=== EDGE CASE TESTS ===${NC}"

log_test "Empty profile name"
EMPTY_NAME=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "", "email": "test@example.com"}')

EMPTY_HTTP=$(echo "$EMPTY_NAME" | tail -n1)
log_warn "Empty name update returned $EMPTY_HTTP (depends on validation)"

log_test "Very long input strings"
LONG_STRING=$(printf 'a%.0s' {1..1000})
LONG_INPUT=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$LONG_STRING\", \"email\": \"test@example.com\"}")

LONG_HTTP=$(echo "$LONG_INPUT" | tail -n1)
log_warn "1000 char input returned $LONG_HTTP"

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "\n${BLUE}=== TEST SUMMARY ===${NC}"
echo -e "Total Tests: $((PASSED + FAILED + WARNINGS))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All critical tests passed!${NC}"
else
    echo -e "\n${RED}❌ Some tests failed - review above${NC}"
fi

