# Environment Variables Setup Guide

## Quick Setup

### Option 1: Full Configuration (Recommended)
```bash
cp .env.example .env
# Then edit .env with your actual API keys and credentials
```

### Option 2: Minimal Local Testing
```bash
cp .env.local.example .env
# This has minimal config for local testing without external services
```

## Required Variables for Basic Testing

At minimum, you need these variables set in your `.env` file:

```bash
# Database (required)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/office_hours_matching?schema=public

# Redis (required)
REDIS_URL=redis://localhost:6379

# JWT Secrets (required - generate secure ones!)
JWT_SECRET=your-secret-here-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-here-min-32-chars
```

## Generating Secure JWT Secrets

```bash
# Generate a secure random secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Optional Services

These are optional - the app will work without them (with reduced functionality):

### Airtable (Optional)
- **Purpose**: Profile synchronization
- **What happens without it**: Airtable sync will fail gracefully, but app works
- **Get API Key**: https://airtable.com/developers/web/guides/personal-access-tokens

### SendGrid Email (Optional)
- **Purpose**: Email notifications for sessions
- **What happens without it**: Emails won't send, but app works
- **Get API Key**: https://app.sendgrid.com/settings/api_keys

### OpenAI (Optional)
- **Purpose**: AI-powered match explanations
- **What happens without it**: Matching works, but uses fallback explanations
- **Get API Key**: https://platform.openai.com/api-keys

## Using Docker Compose

If you're using Docker Compose, the database and Redis are automatically configured:

```bash
docker-compose up -d
```

The `.env` file should use:
- `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/office_hours_matching?schema=public`
- `REDIS_URL=redis://redis:6379`

(Note: Use `postgres` and `redis` as hostnames when running in Docker)

## Testing Checklist

Before running tests, ensure:

- [ ] `.env` file exists (copied from `.env.example`)
- [ ] `DATABASE_URL` is set and database is accessible
- [ ] `REDIS_URL` is set and Redis is running
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are set (min 32 chars)
- [ ] Optional services configured if you want full functionality

## Next Steps

1. Copy `.env.example` to `.env`
2. Fill in your credentials
3. Start services: `docker-compose up -d` or start PostgreSQL/Redis manually
4. Run migrations: `npm run db:migrate`
5. Start server: `npm run dev`

