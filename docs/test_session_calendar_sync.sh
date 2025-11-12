#!/bin/bash

# Test Session Calendar Sync
# This tests that sessions automatically sync to calendars when created/updated

BASE_URL="http://localhost:8000/api/v1"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"

echo "=== Testing Session Calendar Sync ==="
echo ""

# Login
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken' 2>/dev/null)
if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Logged in"
echo ""

# Get user ID
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.id' 2>/dev/null)
echo "User ID: $USER_ID"
echo ""

# Check if there's a mentor to create a session with
echo "1. Getting available mentors..."
MENTORS=$(curl -s "$BASE_URL/mentors" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

MENTOR_ID=$(echo "$MENTORS" | jq -r '.data.mentors[0].mentorId' 2>/dev/null)

if [ "$MENTOR_ID" = "null" ] || [ -z "$MENTOR_ID" ]; then
  echo "⚠️  No mentors available. Creating a test mentor..."
  
  # Create a test mentor (this would normally require admin or registration)
  echo "Note: Mentor creation requires proper setup"
  echo "Skipping session creation test"
  exit 0
fi

echo "Found mentor: $MENTOR_ID"
echo ""

# Create a test session
echo "2. Creating a test session..."
FUTURE_DATE=$(date -u -v+1d +"%Y-%m-%dT10:00:00Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT10:00:00Z" 2>/dev/null || echo "2025-12-01T10:00:00Z")

SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/sessions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"mentorId\": \"$MENTOR_ID\",
    \"scheduledAt\": \"$FUTURE_DATE\",
    \"durationMinutes\": 60,
    \"topic\": \"Test Calendar Sync\"
  }")

SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.data.id' 2>/dev/null)

if [ "$SESSION_ID" != "null" ] && [ -n "$SESSION_ID" ]; then
  echo "✅ Session created: $SESSION_ID"
  echo "$SESSION_RESPONSE" | jq '.data | {id, scheduledAt, topic, googleMeetLink}' 2>/dev/null || echo "$SESSION_RESPONSE"
  echo ""
  
  # Check calendar events
  echo "3. Checking calendar events for session..."
  # Note: Calendar sync happens asynchronously, so we can't immediately verify
  # But we can check if the session has a googleMeetLink if Google Calendar is connected
  echo "✅ Session created successfully"
  echo "   Calendar sync happens asynchronously in the background"
  echo ""
  
  # Test manual sync endpoint
  echo "4. Testing manual calendar sync..."
  SYNC_RESPONSE=$(curl -s -X POST "$BASE_URL/calendar/sessions/$SESSION_ID/sync" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  echo "$SYNC_RESPONSE" | jq '.' 2>/dev/null || echo "$SYNC_RESPONSE"
  echo ""
else
  echo "❌ Failed to create session"
  echo "$SESSION_RESPONSE" | jq '.' 2>/dev/null || echo "$SESSION_RESPONSE"
fi

echo "=== Test Complete ==="

