# Capital Factory Office Hours Matching Tool

An AI-powered mentorship matching platform that connects startup founders with subject matter experts at Capital Factory. The platform facilitates intelligent mentor-mentee matching, session scheduling, feedback collection, and calendar integration.

## 🎯 Overview

The Office Hours Matching Tool streamlines the mentorship connection process by:
- **AI-Driven Matching**: Automatically matches mentees with mentors based on expertise, industry, stage, and availability
- **Automated Scheduling**: Handles session booking, reminders, and calendar synchronization
- **Feedback Collection**: Captures post-session feedback to improve matching quality
- **Calendar Integration**: Syncs sessions with Google Calendar and Outlook Calendar
- **Admin Analytics**: Provides comprehensive platform analytics and data export

## ✨ Features

### Core Features (P0)
- ✅ AI-powered mentor-mentee matching with match explanations
- ✅ Secure authentication with JWT and role-based access control
- ✅ Session management (create, confirm, cancel, reschedule)
- ✅ Email notifications and automated reminders
- ✅ Password reset flow
- ✅ Airtable integration for profile synchronization
- ✅ Notification preferences and delivery tracking

### Enhanced Features (P1)
- ✅ Post-session feedback system with ratings and analytics
- ✅ Admin dashboard with platform analytics
- ✅ CSV/JSON data export capabilities
- ✅ SMS notifications via Twilio
- ✅ In-app notification center
- ✅ Bulk availability management for mentors
- ✅ Advanced mentor filtering and search
- ✅ Favorite mentors functionality

### Calendar Integration (P2)
- ✅ Google Calendar integration with two-way sync
- ✅ Outlook Calendar integration with two-way sync
- ✅ Automatic Google Meet link generation
- ✅ Teams meeting links for Outlook

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT (access + refresh tokens)
- **AI**: Vercel AI SDK, OpenAI API
- **Email**: SendGrid (Nodemailer)
- **SMS**: Twilio
- **Calendar**: Google Calendar API, Microsoft Graph API
- **Scheduling**: node-cron

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis (optional, for caching)
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd capital_factory_mentory_match
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

The backend will run on `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables (if needed)
# Create .env.local with VITE_API_URL=http://localhost:8000/api/v1

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## ⚙️ Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/office_hours_matching

# JWT Secrets
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Server
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Airtable (optional)
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=your_base_id

# Email (optional)
EMAIL_SERVICE_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@capitalfactory.com

# SMS (optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Google Calendar (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft Outlook (optional)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common

# AI (optional)
OPENAI_API_KEY=your_openai_key

# Encryption (optional, auto-generated if not set)
ENCRYPTION_KEY=your_32_byte_hex_key
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## 📁 Project Structure

```
capital_factory_mentory_match/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Configuration (env, database, redis)
│   │   ├── middleware/     # Auth, validation, rate limiting
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utilities (logger, errors, CSV export)
│   │   └── types/          # TypeScript types
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Database migrations
│   └── package.json
│
├── frontend/               # Frontend React app
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state management
│   │   └── types/        # TypeScript types
│   └── package.json
│
└── docs/                  # Documentation
    ├── prd.md            # Product Requirements Document
    ├── IMPLEMENTATION_STATUS.md
    ├── MEMORY_BANK.md    # Technical reference
    └── ...
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/reset-password` - Request password reset
- `POST /api/v1/auth/reset-password/confirm` - Confirm password reset
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/users/:id` - Get user by ID

### Mentors
- `GET /api/v1/mentors` - Get matched mentors (with filtering, sorting, search)
- `GET /api/v1/mentors/:id` - Get mentor details
- `POST /api/v1/mentors/:id/favorite` - Add to favorites
- `DELETE /api/v1/mentors/:id/favorite` - Remove from favorites
- `POST /api/v1/mentors/:id/availability/bulk` - Bulk availability management

### Sessions
- `GET /api/v1/sessions` - Get user sessions
- `POST /api/v1/sessions` - Create session request
- `GET /api/v1/sessions/:id` - Get session details
- `PUT /api/v1/sessions/:id` - Update session
- `DELETE /api/v1/sessions/:id` - Cancel session

### Matching
- `GET /api/v1/matching/explain/:matchId` - Get match explanation

### Calendar
- `GET /api/v1/calendar/google/auth-url` - Get Google OAuth URL
- `GET /api/v1/calendar/outlook/auth-url` - Get Outlook OAuth URL
- `POST /api/v1/calendar/google/callback` - Google OAuth callback
- `POST /api/v1/calendar/outlook/callback` - Outlook OAuth callback
- `GET /api/v1/calendar/integrations` - Get user's calendar integrations
- `POST /api/v1/calendar/sessions/:sessionId/sync` - Manually sync session

### Feedback
- `POST /api/v1/feedback` - Submit feedback
- `GET /api/v1/feedback/:sessionId` - Get feedback by session
- `GET /api/v1/feedback/stats/:mentorId` - Get feedback statistics

### Admin
- `GET /api/v1/admin/analytics` - Platform analytics
- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/sessions` - Get all sessions
- `POST /api/v1/admin/export` - Export data (CSV/JSON)

### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `GET /api/v1/notification-preferences` - Get preferences
- `PUT /api/v1/notification-preferences` - Update preferences

See `docs/integration-guide.md` for detailed API documentation.

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Manual Testing Scripts

Test scripts are available in `docs/`:
- `test_calendar_integration.sh` - Test calendar endpoints
- `test_features.sh` - Test feature endpoints
- `test_session_calendar_sync.sh` - Test session calendar sync

## 📚 Documentation

All documentation is available in the `docs/` folder:

- **Product Requirements**: `docs/prd.md`
- **Implementation Status**: `docs/IMPLEMENTATION_STATUS.md`
- **Technical Reference**: `docs/MEMORY_BANK.md`
- **Integration Guide**: `docs/integration-guide.md`
- **Test Reports**: Various test reports in `docs/`

## 🗄️ Database

### Migrations

```bash
cd backend

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Schema

The database schema is defined in `backend/prisma/schema.prisma`. Key models include:
- `User` - User accounts with roles (mentor, mentee, admin)
- `Session` - Mentorship sessions
- `Feedback` - Post-session feedback
- `Availability` - Mentor availability slots
- `Notification` - System notifications
- `CalendarIntegration` - Calendar OAuth integrations
- `CalendarEvent` - Calendar event tracking

## 🚢 Deployment

### Backend

1. Build the TypeScript code:
   ```bash
   cd backend
   npm run build
   ```

2. Set production environment variables

3. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend

1. Build for production:
   ```bash
   cd frontend
   npm run build
   ```

2. The `dist/` folder contains the production build

3. Serve with a static file server or deploy to Vercel/Netlify

### Docker

Docker files are included:
- `backend/Dockerfile` - Backend container
- `backend/docker-compose.yml` - Docker Compose configuration

## 🔐 Security

- JWT tokens with short expiration times
- Password hashing with bcrypt
- Rate limiting on authentication endpoints
- CORS configuration
- Input validation and sanitization
- Environment variable protection
- Token encryption for calendar integrations

## 📝 License

MIT License

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue in the repository.

## 🎯 Roadmap

- [ ] Mobile application
- [ ] Real-time notifications (WebSockets)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Video conferencing integration

---

**Built for Capital Factory** 🚀

