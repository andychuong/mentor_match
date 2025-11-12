# Environment Variables Guide

## 🔐 JWT Secrets - Generate Your Own

**Yes, you need to generate your own JWT secrets.** These are used to sign and verify authentication tokens. They should be:
- Long, random strings (at least 32 characters, preferably 64+)
- Kept secret and never committed to version control
- Different for each environment (dev, staging, production)

### Generate JWT Secrets

You can generate secure random strings using one of these methods:

**Option 1: Using OpenSSL (Recommended)**
```bash
# Generate JWT_SECRET (64 characters)
openssl rand -hex 32

# Generate JWT_REFRESH_SECRET (64 characters)
openssl rand -hex 32

# Generate ENCRYPTION_KEY for calendar tokens (64 characters)
openssl rand -hex 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 3: Using Python**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Example output:**
```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
JWT_REFRESH_SECRET=f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3
ENCRYPTION_KEY=c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a3
```

---

## ✅ Required Environment Variables

These are **mandatory** for the application to run in production:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@host:5432/dbname` |
| `JWT_SECRET` | Secret key for signing access tokens | `a1b2c3d4...` (64+ chars) |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | `f2e1d0c9...` (64+ chars) |

---

## 🔧 Core Configuration (Recommended)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `development` | `production` |
| `PORT` | Server port | `8000` | `8000` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` | `https://your-app.amplify.app` |
| `REDIS_URL` | Redis connection string (optional) | `redis://localhost:6379` | `redis://your-redis:6379` |

---

## 🤖 AI Service (Required for Matching)

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI matching | `sk-...` |
| `AI_MODEL` | OpenAI model to use | `gpt-4-turbo-preview` |

---

## 📧 Email Service (Optional - Can Use Mock Mode)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `EMAIL_SERVICE_API_KEY` | SendGrid API key | - | `SG.xxx...` |
| `EMAIL_FROM` | Sender email address | `noreply@capitalfactory.com` | `noreply@yourdomain.com` |
| `EMAIL_FROM_NAME` | Sender name | `Capital Factory Office Hours` | `Your App Name` |
| `EMAIL_MOCK_MODE` | Enable mock mode (logs emails, doesn't send) | `false` | `true` |

**For demos/testing:** Set `EMAIL_MOCK_MODE=true` to avoid needing SendGrid credentials.

---

## 📱 SMS Service (Optional - Can Use Mock Mode)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | - | `ACxxx...` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | - | `xxx...` |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | - | `+1234567890` |
| `SMS_MOCK_MODE` | Enable mock mode (logs SMS, doesn't send) | `false` | `true` |

**For demos/testing:** Set `SMS_MOCK_MODE=true` to avoid needing Twilio credentials.

---

## 📅 Calendar Integration (Optional)

### Google Calendar

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `xxx` |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI | `https://your-app.amplify.app/auth/google/callback` |

### Microsoft/Outlook Calendar

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MICROSOFT_CLIENT_ID` | Microsoft App Client ID | - | `xxx` |
| `MICROSOFT_CLIENT_SECRET` | Microsoft App Client Secret | - | `xxx` |
| `MICROSOFT_TENANT_ID` | Azure AD Tenant ID | `common` | `xxx` |
| `MICROSOFT_REDIRECT_URI` | OAuth redirect URI | - | `https://your-app.amplify.app/auth/microsoft/callback` |

### Calendar Token Encryption

| Variable | Description | Example |
|----------|-------------|---------|
| `ENCRYPTION_KEY` | Key for encrypting OAuth tokens (64 hex chars) | `a1b2c3d4...` (generate with `openssl rand -hex 32`) |

---

## 📊 Airtable Integration (Optional)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `AIRTABLE_API_KEY` | Airtable API key | - | `patxxx...` |
| `AIRTABLE_BASE_ID` | Airtable Base ID | - | `appxxx...` |
| `AIRTABLE_TABLE_USERS` | Users table name | `Users` | `Users` |
| `AIRTABLE_TABLE_MENTORS` | Mentors table name | `Mentors` | `Mentors` |

---

## ☁️ AWS Configuration (Optional - for AWS services)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `AWS_REGION` | AWS region | `us-east-1` | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | - | `AKIAxxx...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - | `xxx...` |

---

## 🛠️ Development/Testing

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Logging level | `info` | `debug`, `info`, `warn`, `error` |
| `DISABLE_RATE_LIMIT` | Disable rate limiting (dev only) | `false` | `true` |
| `MOCK_MODE` | Enable mock mode for all services | `false` | `true` |

---

## 📝 Setting Environment Variables in AWS ECS

### Option 1: Task Definition (Recommended)

1. In your ECS Task Definition, go to the **Container Definitions** section
2. Select your container
3. Scroll to **Environment variables**
4. Click **Add environment variable**
5. Add each variable:
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://user:password@host:5432/dbname`

### Option 2: AWS Systems Manager Parameter Store (More Secure)

For sensitive values like secrets:

1. Store secrets in AWS Systems Manager Parameter Store:
   ```bash
   aws ssm put-parameter \
     --name "/office-hours/jwt-secret" \
     --value "your-secret-here" \
     --type "SecureString"
   ```

2. In your ECS Task Definition, reference the parameter:
   - **Key:** `JWT_SECRET`
   - **ValueFrom:** `arn:aws:ssm:us-east-1:ACCOUNT_ID:parameter/office-hours/jwt-secret`

### Option 3: AWS Secrets Manager (Most Secure)

1. Store secrets in AWS Secrets Manager
2. Grant your ECS task role permission to read the secret
3. Reference in Task Definition using `valueFrom`

---

## 🚀 Quick Start: Minimum Required Variables

For a basic deployment, you need at least:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT Secrets (generate these!)
JWT_SECRET=<generate-with-openssl-rand-hex-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-hex-32>

# Environment
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-frontend.amplify.app

# AI Matching (required for mentor matching)
OPENAI_API_KEY=sk-...

# Optional: Mock mode for demos
EMAIL_MOCK_MODE=true
SMS_MOCK_MODE=true
```

---

## 🔒 Security Best Practices

1. **Never commit secrets to version control**
   - Use `.gitignore` to exclude `.env` files
   - Use AWS Secrets Manager or Parameter Store for production

2. **Use different secrets for each environment**
   - Dev, staging, and production should have different JWT secrets

3. **Rotate secrets regularly**
   - Change JWT secrets periodically (requires re-authentication of all users)

4. **Use least privilege**
   - Only grant necessary AWS permissions to your ECS task role

5. **Enable encryption**
   - Use AWS Secrets Manager with encryption at rest
   - Use HTTPS for all API communication

---

## 📋 Example: Complete Environment Variable List

Here's a complete example for production deployment:

```bash
# Core
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-app.amplify.app

# Database
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/officehours

# JWT (generate these!)
JWT_SECRET=<64-char-hex-string>
JWT_REFRESH_SECRET=<64-char-hex-string>

# Encryption
ENCRYPTION_KEY=<64-char-hex-string>

# AI
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4-turbo-preview

# Email (or use mock mode)
EMAIL_SERVICE_API_KEY=SG.xxx...
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Office Hours
# EMAIL_MOCK_MODE=true  # Uncomment for demos

# SMS (or use mock mode)
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_PHONE_NUMBER=+1234567890
# SMS_MOCK_MODE=true  # Uncomment for demos

# Calendar (optional)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://your-app.amplify.app/auth/google/callback

MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=https://your-app.amplify.app/auth/microsoft/callback

# Airtable (optional)
AIRTABLE_API_KEY=patxxx...
AIRTABLE_BASE_ID=appxxx...

# Logging
LOG_LEVEL=info
```

---

## 🧪 Testing Your Environment Variables

After setting up your environment variables, test that they're loaded correctly:

```bash
# In your container/ECS task
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set ✓' : 'Missing ✗')"
```

---

## ❓ Troubleshooting

**Issue:** "Missing required environment variable: JWT_SECRET"
- **Solution:** Generate and set `JWT_SECRET` and `JWT_REFRESH_SECRET`

**Issue:** Database connection fails
- **Solution:** Verify `DATABASE_URL` format: `postgresql://user:password@host:port/dbname`

**Issue:** Frontend can't connect to backend
- **Solution:** Check `FRONTEND_URL` matches your actual frontend URL and CORS is configured

**Issue:** Calendar integration not working
- **Solution:** Verify OAuth redirect URIs match exactly (including protocol and trailing slashes)



