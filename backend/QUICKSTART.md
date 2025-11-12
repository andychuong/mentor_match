# Quick Start Guide

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 15+ running (or use Docker)
- Redis 7+ running (or use Docker)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` - Your PostgreSQL connection string
- `REDIS_URL` - Your Redis connection string
- `JWT_SECRET` - A random secret string for JWT tokens
- `JWT_REFRESH_SECRET` - Another random secret string
- `AIRTABLE_API_KEY` - Your Airtable API key (if using Airtable)
- `AIRTABLE_BASE_ID` - Your Airtable base ID
- `EMAIL_SERVICE_API_KEY` - Your SendGrid API key (if using email)
- `OPENAI_API_KEY` - Your OpenAI API key (for AI matching)

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:8000`

## Using Docker Compose

If you prefer to use Docker:

```bash
# Start all services (PostgreSQL, Redis, Backend)
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate dev

# View logs
docker-compose logs -f backend
```

## Testing the API

### Health Check

```bash
curl http://localhost:8000/api/v1/health
```

### Create a User (via Prisma Studio or direct DB)

You can use Prisma Studio to create a test user:

```bash
npm run db:studio
```

Or create a user directly in the database with a hashed password.

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Use the Access Token

```bash
# Replace YOUR_ACCESS_TOKEN with the token from login response
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Next Steps

1. Review the API endpoints in `README.md`
2. Set up your frontend to connect to this backend
3. Configure Airtable integration if needed
4. Set up email service for notifications
5. Configure OpenAI API for AI matching

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` in `.env`
- Ensure database exists: `createdb office_hours_matching`

### Redis Connection Issues

- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `.env`

### Port Already in Use

- Change `PORT` in `.env` to a different port
- Or stop the process using port 8000

