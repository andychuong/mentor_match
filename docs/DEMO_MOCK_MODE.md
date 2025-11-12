# Demo Mock Mode Guide

## Overview

The application supports mock mode for **Twilio (SMS)** and **SendGrid (Email)** services. This allows you to run demos without actual API credentials and see all notifications in the console.

## 🎯 Benefits

- ✅ **No API credentials needed** - Perfect for demos
- ✅ **Visible notifications** - All emails/SMS are logged to console
- ✅ **Pretty formatting** - Easy to read during presentations
- ✅ **No errors** - Application continues normally
- ✅ **Automatic fallback** - Uses mock if credentials are missing

## 🚀 How to Enable

### Option 1: Enable for Both Services (Recommended)

Add to your `.env` file:
```bash
MOCK_MODE=true
```

Or run with environment variable:
```bash
MOCK_MODE=true npm run dev
```

### Option 2: Enable Individually

```bash
EMAIL_MOCK_MODE=true SMS_MOCK_MODE=true npm run dev
```

Or in `.env`:
```bash
EMAIL_MOCK_MODE=true
SMS_MOCK_MODE=true
```

### Option 3: Automatic Fallback

If you don't set credentials, the services automatically use mock mode:
- No `EMAIL_SERVICE_API_KEY` → Email mock mode
- No `TWILIO_ACCOUNT_SID` → SMS mock mode

## 📧 Email Mock Output

When an email would be sent, you'll see:

```
================================================================================
📧 MOCK EMAIL NOTIFICATION
================================================================================
To:      user@example.com
From:    Capital Factory Office Hours <noreply@capitalfactory.com>
Subject: Session Confirmed - Capital Factory Office Hours
Time:    11/12/2024, 2:30:45 PM
--------------------------------------------------------------------------------
Content:
Session Confirmed

Your session has been confirmed:

• Mentor: Sarah Chen
• Date & Time: 11/15/2024, 10:00:00 AM
• Duration: 60 minutes
• Topic: Product-Market Fit Strategy

We'll send you a reminder 24 hours before your session.
================================================================================
```

## 📱 SMS Mock Output

When an SMS would be sent, you'll see:

```
================================================================================
📱 MOCK SMS NOTIFICATION
================================================================================
To:      +1234567890
From:    MOCK_NUMBER
Time:    11/12/2024, 2:30:45 PM
Message: Reminder: You have a session with Sarah Chen in 1 hour (11/15/2024, 10:00:00 AM). Topic: Product-Market Fit Strategy
================================================================================
```

## 🎬 Demo Scenarios

### Scenario 1: Session Confirmation Email

**Action:** Mentee requests session, mentor confirms

**What you'll see:**
- Email notification logged to console
- Full email content visible
- Subject: "Session Confirmed - Capital Factory Office Hours"

### Scenario 2: Session Reminder (Email + SMS)

**Action:** Automated reminder 24 hours before session

**What you'll see:**
- Email reminder logged
- SMS reminder logged (if user has SMS enabled)
- Both show full content

### Scenario 3: Password Reset Email

**Action:** User requests password reset

**What you'll see:**
- Email with reset link logged
- Full email content visible

## 🔍 Verifying Mock Mode

When the server starts, you'll see:

```
📧 Email service running in MOCK MODE - emails will be logged but not sent
📱 SMS service running in MOCK MODE - messages will be logged but not sent
```

Or if credentials are missing:

```
Email service not configured - SendGrid API key missing. Using mock mode.
SMS service not configured - Twilio credentials missing or package not installed. Using mock mode.
```

## ⚙️ Switching Between Mock and Real

### For Demo (Mock Mode)
```bash
MOCK_MODE=true npm run dev
```

### For Production (Real Services)
```bash
# Remove MOCK_MODE from .env or set to false
EMAIL_SERVICE_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
npm run dev
```

## 📝 Demo Tips

1. **Keep Console Visible**: During demo, keep the terminal/console visible so notifications are seen
2. **Trigger Actions**: Perform actions that send notifications:
   - Create/confirm sessions
   - Request password reset
   - Wait for automated reminders (or manually trigger)
3. **Explain Mock Mode**: Let audience know you're in demo mode to avoid confusion
4. **Show Real vs Mock**: You can toggle between modes to show both behaviors

## 🎯 Example Demo Flow

1. **Start server with mock mode:**
   ```bash
   MOCK_MODE=true npm run dev
   ```

2. **Create a session** (mentee requests, mentor confirms)

3. **Show console output:**
   - Point out the email notification
   - Show full email content
   - Explain what would be sent in production

4. **Trigger reminder:**
   - Show both email and SMS (if enabled)
   - Demonstrate multi-channel notifications

5. **Explain production behavior:**
   - In production, these would be real emails/SMS
   - Show how easy it is to switch modes

## 🔐 Security Note

Mock mode is safe for demos because:
- No actual emails/SMS are sent
- No API calls are made
- No credentials are required
- No charges are incurred

## 🐛 Troubleshooting

### Not seeing mock output?
- Check that `MOCK_MODE=true` is set
- Verify console/terminal is visible
- Check server logs for initialization messages

### Want to disable mock mode?
- Remove `MOCK_MODE=true` from `.env`
- Add real API credentials
- Restart server

### Mock mode not working?
- Check environment variables are loaded correctly
- Verify services are initialized (check startup logs)
- Ensure `.env` file is in the backend directory

---

**Ready for your demo!** 🎉

