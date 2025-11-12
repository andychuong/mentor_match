# Office Hours Matching Tool - Backend API

Backend API for the Capital Factory Office Hours Matching Tool - an AI-powered mentor-mentee platform.

## Technology Stack

- **Runtime:** Node.js 20
- **Language:** TypeScript
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Cache:** Redis
- **AI SDK:** Vercel AI SDK (OpenAI)
- **Email:** SendGrid (via Nodemailer)
- **Authentication:** JWT

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional)

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration (API keys, database URLs, etc.)

4. Start services:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
docker-compose exec backend npx prisma migrate dev
```

6. The API will be available at `http://localhost:8000`

### Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:8000`

## Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT access tokens
- `JWT_REFRESH_SECRET` - Secret for JWT refresh tokens
- `AIRTABLE_API_KEY` - Airtable API key
- `AIRTABLE_BASE_ID` - Airtable base ID
- `EMAIL_SERVICE_API_KEY` - SendGrid API key
- `OPENAI_API_KEY` - OpenAI API key for AI matching

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/users/:id` - Get user by ID

### Mentors
- `GET /api/v1/mentors` - List mentors with AI matching
- `GET /api/v1/mentors/:id` - Get mentor details
- `GET /api/v1/mentors/:id/availability` - Get mentor availability
- `POST /api/v1/mentors/:id/availability` - Set mentor availability
- `GET /api/v1/mentors/:id/matches` - Get matches for mentor

### Sessions
- `GET /api/v1/sessions` - List sessions
- `GET /api/v1/sessions/:id` - Get session details
- `POST /api/v1/sessions` - Create session
- `PUT /api/v1/sessions/:id` - Update session
- `DELETE /api/v1/sessions/:id` - Cancel session

### Feedback
- `POST /api/v1/feedback` - Submit feedback
- `GET /api/v1/feedback/:sessionId` - Get feedback by session
- `GET /api/v1/feedback/mentors/:mentorId` - Get mentor feedback
- `GET /api/v1/feedback/stats/:mentorId` - Get feedback statistics

### Admin
- `GET /api/v1/admin/analytics` - Platform analytics
- `GET /api/v1/admin/analytics/sessions` - Session analytics
- `GET /api/v1/admin/analytics/mentors` - Mentor utilization
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/sessions` - List all sessions
- `POST /api/v1/admin/export` - Export data

### Webhooks & Sync
- `POST /api/v1/webhooks/airtable` - Airtable webhook endpoint
- `POST /api/v1/sync/airtable/:userId` - Manual Airtable sync
- `GET /api/v1/sync/status/:userId` - Get sync status

## Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npm run db:generate

# Create and apply migration
npm run db:migrate

# Push schema changes (development only)
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── index.ts         # Application entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── dist/                # Compiled JavaScript (generated)
└── logs/               # Application logs
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Build for Production

```bash
npm run build
```

### Docker Deployment

```bash
# Build image
docker build -t office-hours-backend .

# Run container
docker run -p 8000:8000 --env-file .env office-hours-backend
```

## Security

- JWT tokens for authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js for security headers
- Input validation with express-validator
- SQL injection prevention (Prisma parameterized queries)

## Performance

- Redis caching for match results
- Database connection pooling
- Query optimization with Prisma
- Rate limiting to prevent abuse

## Monitoring

- Winston logger for structured logging
- Health check endpoint: `GET /api/v1/health`
- Error tracking (integrate with Sentry or similar)

## License

MIT

## Support

For issues and questions, please contact the development team.

