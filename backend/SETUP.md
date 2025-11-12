# Environment Setup Guide

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your actual values**

3. **For local testing with minimal setup, you can use:**
   ```bash
   cp .env.local.example .env
   ```
   Then add only the services you want to test.

## Required Variables

### Minimum for Local Testing:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string  
- `JWT_SECRET` - Random secret string (min 32 chars)
- `JWT_REFRESH_SECRET` - Random secret string (min 32 chars)

### Optional (for full functionality):
- `AIRTABLE_API_KEY` - For Airtable sync (can skip for testing)
- `EMAIL_SERVICE_API_KEY` - For email notifications (can skip for testing)
- `OPENAI_API_KEY` - For AI matching explanations (will use fallback without it)

## Generating Secrets

Generate secure random secrets:
```bash
# Generate JWT secrets
openssl rand -base64 32
```

## Using Docker Compose

If you use Docker Compose, the database and Redis URLs are automatically configured:
```bash
docker-compose up -d
```

The `.env` file will use these defaults:
- `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/office_hours_matching?schema=public`
- `REDIS_URL=redis://redis:6379`

## Service Setup Links

- **Airtable**: https://airtable.com/developers/web/guides/personal-access-tokens
- **SendGrid**: https://app.sendgrid.com/settings/api_keys
- **OpenAI**: https://platform.openai.com/api-keys

## Testing Without External Services

You can test the backend without:
- Airtable (sync will fail gracefully)
- SendGrid (emails won't send, but app will work)
- OpenAI (matching will use fallback explanations)

Just leave those API keys empty in your `.env` file.

