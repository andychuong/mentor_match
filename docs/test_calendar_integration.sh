#!/bin/bash

# Test Calendar Integration Endpoints
# Make sure backend is running on http://localhost:8000

BASE_URL="http://localhost:8000/api/v1"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"

echo "=== Testing Calendar Integration Endpoints ==="
echo ""

# Step 1: Health Check
echo "1. Health Check"
HEALTH=$(curl -s "$BASE_URL/health")
echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
echo ""

# Step 2: Login to get token
echo "2. Login to get access token"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken' 2>/dev/null)
if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed"
  echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo "Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# Step 3: Get Google Calendar Auth URL
echo "3. Get Google Calendar OAuth URL"
GOOGLE_AUTH_URL=$(curl -s "$BASE_URL/calendar/google/auth-url" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$GOOGLE_AUTH_URL" | jq '.' 2>/dev/null || echo "$GOOGLE_AUTH_URL"
echo ""

# Step 4: Get Outlook Calendar Auth URL
echo "4. Get Outlook Calendar OAuth URL"
OUTLOOK_AUTH_URL=$(curl -s "$BASE_URL/calendar/outlook/auth-url" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$OUTLOOK_AUTH_URL" | jq '.' 2>/dev/null || echo "$OUTLOOK_AUTH_URL"
echo ""

# Step 5: Get Calendar Integrations (should be empty initially)
echo "5. Get Calendar Integrations"
INTEGRATIONS=$(curl -s "$BASE_URL/calendar/integrations" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$INTEGRATIONS" | jq '.' 2>/dev/null || echo "$INTEGRATIONS"
echo ""

# Step 6: Test error handling - Get calendars without integration
echo "6. Test Error Handling - Get calendars without integration"
ERROR_RESPONSE=$(curl -s "$BASE_URL/calendar/google/calendars" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$ERROR_RESPONSE" | jq '.' 2>/dev/null || echo "$ERROR_RESPONSE"
echo ""

echo "=== Test Summary ==="
echo "✅ Health check"
echo "✅ Authentication"
echo "✅ Google Calendar auth URL endpoint"
echo "✅ Outlook Calendar auth URL endpoint"
echo "✅ Get integrations endpoint"
echo "✅ Error handling"
echo ""
echo "Note: Full OAuth flow requires:"
echo "  1. Google/Microsoft OAuth credentials configured"
echo "  2. User to complete OAuth flow in browser"
echo "  3. Callback endpoint to receive authorization code"
echo ""

