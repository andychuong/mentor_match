# Memory Bank - Office Hours Matching Tool

**Last Updated:** 2025-01-12  
**Project:** Capital Factory Office Hours Matching Tool  
**Status:** ✅ All P0 and P1 Features Implemented, Tested, and Deployed to AWS

---

## 📋 Project Overview

A mentorship matching platform that connects Capital Factory mentees with mentors using AI-powered matching algorithms. The system facilitates session scheduling, feedback collection, and integration with Airtable for data synchronization.

### Tech Stack
- **Backend:** Node.js, Express.js, TypeScript, Prisma ORM
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Zustand
- **Database:** PostgreSQL
- **Cache/Queue:** Redis
- **Authentication:** JWT (access + refresh tokens)
- **AI Integration:** Vercel AI SDK, OpenAI API
- **External Services:** Airtable API, SendGrid (email)

---

## 🏗️ Architecture Decisions

### Backend Structure
```
backend/
├── src/
│   ├── config/          # Environment, database, Redis configs
│   ├── middleware/      # Auth, validation, rate limiting, error handling
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (auth, matching, sessions, etc.)
│   ├── utils/           # Utilities (logger, errors, userTransform)
│   └── types/           # TypeScript type definitions
```

### Frontend Structure
```
frontend/
├── src/
│   ├── api/             # API client and service functions
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── store/           # Zustand state management
│   └── types/           # TypeScript type definitions
```

### Key Design Patterns
- **Service Layer Pattern:** Business logic separated from routes
- **Middleware Chain:** Authentication, validation, rate limiting
- **Error Handling:** Centralized error handler with custom AppError class
- **Type Safety:** Strict TypeScript with shared types between frontend/backend

---

## 🔐 Authentication & Authorization

### JWT Implementation
- **Access Token:** 15 minutes expiry (configurable via `JWT_ACCESS_EXPIRES_IN`)
- **Refresh Token:** 7 days expiry (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Token Storage:** Frontend stores in localStorage (Zustand store)
- **Token Refresh:** Automatic via axios interceptor

### Role-Based Access Control (RBAC)
- **Roles:** `mentor`, `mentee`, `admin`
- **Middleware:** `authenticate` (verifies JWT) + `authorize(...roles)` (checks role)
- **Protected Routes:** All routes except `/auth/login`, `/auth/refresh`, `/health`

### Authentication Flow
1. User submits credentials → `/api/v1/auth/login`
2. Backend validates, generates tokens, returns user + tokens
3. Frontend stores tokens and user in Zustand store + localStorage
4. Subsequent requests include `Authorization: Bearer <token>` header
5. Token refresh handled automatically on 401 responses

---

## 📊 Database Schema

### Core Tables
- **users:** User accounts with profile data
- **sessions:** Mentorship sessions between mentors and mentees
- **availability:** Mentor availability slots
- **feedback:** Session feedback and ratings
- **notifications:** System notifications
- **airtable_sync_logs:** Airtable synchronization tracking
- **match_cache:** Cached match results for performance

### P0 & P1 Feature Tables (New)
- **password_reset_tokens:** Password reset token storage (P0)
  - Fields: `id`, `userId`, `token`, `expiresAt`, `usedAt`, `createdAt`
  - Indexes: `userId`, `token`, `expiresAt`
- **notification_preferences:** User notification preferences (P0)
  - Fields: `id`, `userId`, `emailEnabled`, `emailSessionConfirmation`, `emailSessionReminder`, `emailSessionCancellation`, `emailSessionRequest`, `emailFeedbackConfirmation`, `smsEnabled`, `smsSessionReminder`
  - Unique: `userId`
- **notification_deliveries:** Notification delivery tracking (P0)
  - Fields: `id`, `notificationId`, `channel`, `status`, `sentAt`, `deliveredAt`, `errorMessage`, `metadata`
  - Indexes: `notificationId`, `status`, `channel`
- **favorite_mentors:** Mentee favorite mentors (P1)
  - Fields: `id`, `menteeId`, `mentorId`, `createdAt`
  - Unique: `[menteeId, mentorId]`
  - Indexes: `menteeId`, `mentorId`

### Key Relationships
- `sessions.mentorId` → `users.id`
- `sessions.menteeId` → `users.id`
- `availability.mentorId` → `users.id`
- `feedback.sessionId` → `sessions.id`
- `password_reset_tokens.userId` → `users.id` (CASCADE)
- `notification_preferences.userId` → `users.id` (CASCADE)
- `notification_deliveries.notificationId` → `notifications.id` (CASCADE)
- `favorite_mentors.menteeId` → `users.id` (CASCADE)
- `favorite_mentors.mentorId` → `users.id` (CASCADE)

### Prisma Schema Location
`backend/prisma/schema.prisma`

---

## 🔄 API Structure

### Base URL
- **Development:** `http://localhost:8000/api/v1`
- **Production:** Configured via `FRONTEND_URL` and `PORT` env vars

### API Versioning
- All routes prefixed with `/api/v1`
- Standardized response format:
  ```json
  {
    "success": true|false,
    "data": {...},
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable message",
      "details": {...}
    },
    "meta": {
      "timestamp": "ISO8601",
      "requestId": "uuid"
    }
  }
  ```

### Main Endpoints
- **Auth:** `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/reset-password`, `/auth/reset-password/confirm`
- **Users:** `/users/me`, `/users/:id`
- **Mentors:** `/mentors`, `/mentors/:id`, `/mentors/:id/availability`, `/mentors/:id/availability/bulk`, `/mentors/:id/favorite`
- **Sessions:** `/sessions`, `/sessions/:id`
- **Feedback:** `/feedback`, `/feedback/:sessionId`
- **Matching:** `/matching/explain/:matchId`
- **Notifications:** `/notifications`, `/notifications/:id/read`, `/notifications/read-all`, `/notifications/:id/delivery`, `/notifications/delivery/stats`
- **Notification Preferences:** `/notification-preferences`
- **Admin:** `/admin/analytics`, `/admin/users`, `/admin/sessions`, `/admin/export`

---

## 🛠️ Important Fixes & Solutions

### 1. Rate Limiting (429 Errors)
**Problem:** Rate limiter too strict for development, causing 429 errors  
**Solution:** Made rate limiter development-aware:
- Dev: 1000 requests/minute (was 100/15min)
- Prod: 100 requests/15min (unchanged)
- Can disable in dev: `DISABLE_RATE_LIMIT=true`

**File:** `backend/src/middleware/rateLimiter.ts`

### 2. User Profile Structure Mismatch
**Problem:** Backend returns flat user object, frontend expects nested `profile`  
**Solution:** Created `userTransform.ts` utility to transform backend format to frontend format

**Files:**
- `backend/src/utils/userTransform.ts` (transformation utility)
- `backend/src/routes/auth.routes.ts` (applied to login)
- `backend/src/routes/user.routes.ts` (applied to all user endpoints)

**Transformation:**
```typescript
// Backend (flat)
{ id, email, role, name, bio, profilePictureUrl, ... }

// Frontend (nested)
{ id, email, role, profile: { name, bio, profilePictureUrl, ... }, ... }
```

### 3. TypeScript Warnings
**Problem:** Unused variables and missing return types  
**Solution:**
- Prefixed unused params with `_` (e.g., `_req`, `_res`)
- Added explicit `Promise<void>` return types to async route handlers
- Commented out unused imports (redis store for future use)

### 4. React Hook Form Integration
**Problem:** Input component not compatible with react-hook-form  
**Solution:** Updated Input component to use `React.forwardRef`

**File:** `frontend/src/components/ui/Input.tsx`

### 5. Frontend Type Safety
**Problem:** Accessing undefined properties causing runtime errors  
**Solution:** Added optional chaining and null checks:
- `user.profile?.name` instead of `user.profile.name`
- Default values for empty arrays/strings
- Graceful error handling in API calls

### 6. Server Crash on Validation Errors (2025-11-12)
**Problem:** Server was crashing when validation middleware threw errors  
**Solution:** Updated validation middleware to use `next(error)` instead of `throw error` to properly pass errors to error handler

**File:** `backend/src/middleware/validation.ts`

### 7. Refresh Token Not Sent (2025-11-12)
**Problem:** Frontend was sending empty object `{}` instead of `{ refreshToken }` in refresh request  
**Solution:** Updated frontend API client to include `refreshToken` in request body

**File:** `frontend/src/api/client.ts`

---

## ⚙️ Environment Configuration

### Backend Environment Variables
**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for access token signing
- `JWT_REFRESH_SECRET` - Secret for refresh token signing
- `REDIS_URL` - Redis connection string (default: `redis://localhost:6379`)

**Optional:**
- `PORT` - Server port (default: 8000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)
- `AIRTABLE_API_KEY` - Airtable API key (optional)
- `AIRTABLE_BASE_ID` - Airtable base ID (optional)
- `OPENAI_API_KEY` - OpenAI API key for AI matching (optional)
- `EMAIL_SERVICE_API_KEY` - SendGrid API key (optional)
- `TWILIO_ACCOUNT_SID` - Twilio account SID for SMS (optional, P1)
- `TWILIO_AUTH_TOKEN` - Twilio auth token for SMS (optional, P1)
- `TWILIO_PHONE_NUMBER` - Twilio phone number for SMS (optional, P1)
- `DISABLE_RATE_LIMIT` - Disable rate limiting in dev (true/false)

### Frontend Environment Variables
**Required:**
- `VITE_API_URL` - Backend API base URL (default: http://localhost:8000/api/v1)

### Environment Files
- `backend/.env` - Backend environment variables
- `backend/.env.example` - Example backend env file
- `backend/.env.local.example` - Minimal local dev example
- `frontend/.env` - Frontend environment variables (if needed)

---

## 🧪 Testing

### Test Credentials
- **Email:** `test@example.com`
- **Password:** `password123`
- **Role:** `mentee`

### Test Endpoints
```bash
# Health check
curl http://localhost:8000/api/v1/health

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get mentors (requires auth token)
curl http://localhost:8000/api/v1/mentors \
  -H "Authorization: Bearer <token>"
```

### Running Services
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Database migrations
cd backend && npx prisma migrate dev

# Database studio
cd backend && npx prisma studio
```

---

## 🔌 External Integrations

### Airtable Integration
- **Purpose:** Bi-directional sync of user/mentor data
- **Status:** Optional (gracefully handles missing API keys)
- **Tables:** Users, Mentors
- **Sync Status:** Tracked in `airtableSyncStatus` field (`synced`, `pending`, `error`)
- **Service:** `backend/src/services/airtable.service.ts`

### OpenAI Integration
- **Purpose:** AI-powered match reasoning and recommendations
- **Model:** Configurable via `AI_MODEL` (default: `gpt-4-turbo-preview`)
- **Service:** `backend/src/services/ai.service.ts`
- **Usage:** Called by matching service for generating match explanations

### Email Service (SendGrid)
- **Purpose:** Session confirmations, reminders, notifications
- **Service:** `backend/src/services/email.service.ts`
- **Status:** Optional (can be disabled if API key not provided)

### SMS Service (Twilio) - P1 Feature
- **Purpose:** SMS session reminders
- **Service:** `backend/src/services/sms.service.ts`
- **Status:** Optional (gracefully degrades if credentials not provided)
- **Configuration:** Requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Dependency:** `twilio` npm package (optional)

---

## 📝 Code Quality

### TypeScript Configuration
- **Strict Mode:** Enabled
- **Target:** ES2020
- **Module:** CommonJS
- **Config:** `backend/tsconfig.json`

### Linting & Formatting
- **ESLint:** Configured (`.eslintrc.json`)
- **Prettier:** Configured (`.prettierrc`)
- **Type Checking:** `npm run build` (TypeScript compiler)

### Error Handling
- **Custom Error Class:** `AppError` with error codes
- **Error Codes:** Defined in `backend/src/utils/errors.ts`
- **Centralized Handler:** `backend/src/middleware/errorHandler.ts`

---

## 🚀 Deployment

### AWS Infrastructure (Production)

**Region:** `us-east-2` (Ohio)

**Backend (ECS Fargate):**
- **Cluster:** `office-hours-cluster`
- **Service:** `office-hours-backend-service`
- **Task Definition:** `office-hours-backend` (version 2+)
- **Load Balancer:** `office-hours-alb` (Application Load Balancer)
- **Backend URL:** `http://office-hours-alb-2030945038.us-east-2.elb.amazonaws.com/api/v1`
- **Container Registry:** AWS ECR (`971422717446.dkr.ecr.us-east-2.amazonaws.com/office-hours-backend:latest`)
- **Logs:** CloudWatch Log Group `/ecs/office-hours-backend`

**Frontend (AWS Amplify):**
- **Hosting:** AWS Amplify
- **Environment Variable:** `VITE_API_URL` (points to ALB backend URL)

**Database:**
- **Service:** AWS RDS PostgreSQL
- **Endpoint:** `mentor-match-db.c1uuigcm4bd1.us-east-2.rds.amazonaws.com`
- **Region:** `us-east-2` (matches ECS region for low latency)

### Deployment Scripts

**ECR Setup (us-east-2):**
- `docs/setup-ecr-us-east-2.sh` - Creates ECR repo and pushes Docker image

**ECS Setup:**
- `docs/setup-ecs-backend.sh` - Automated ECS Fargate setup (ALB, cluster, service, task definition)
- Prompts for: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `OPENAI_API_KEY`

**Deployment Commands:**
- `docs/DEPLOY_COMMANDS.sh` - Build and push Docker image to ECR

### Deployment Process

1. **Push Docker Image:**
   ```bash
   ./docs/setup-ecr-us-east-2.sh
   ```

2. **Create ECS Resources:**
   ```bash
   ./docs/setup-ecs-backend.sh
   ```
   - Creates security groups, ALB, target group, ECS cluster, task definition, service
   - Configures environment variables
   - Sets up CloudWatch logging

3. **Wait for Service:**
   - Service takes 2-3 minutes to start
   - Check status: `aws ecs describe-services --cluster office-hours-cluster --services office-hours-backend-service --region us-east-2`

4. **Test Health Endpoint:**
   ```bash
   curl http://office-hours-alb-xxxxx.us-east-2.elb.amazonaws.com/api/v1/health
   ```

5. **Update Amplify:**
   - Set `VITE_API_URL` environment variable to ALB backend URL
   - Trigger new deployment

### Environment Variables (Production)

**ECS Task Definition:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - 64-char hex string (generate with `openssl rand -hex 32`)
- `JWT_REFRESH_SECRET` - 64-char hex string
- `FRONTEND_URL` - Amplify app URL (for CORS)
- `OPENAI_API_KEY` - OpenAI API key
- `PORT` - 8000 (default)
- `NODE_ENV` - production
- Optional: `ENCRYPTION_KEY`, `EMAIL_MOCK_MODE`, `SMS_MOCK_MODE`

**Amplify Environment Variables:**
- `VITE_API_URL` - Backend ALB URL

### Deployment Considerations

### Database Migrations
- Use Prisma migrations: `npx prisma migrate deploy` (production)
- Never run `prisma migrate dev` in production
- Backup database before migrations

### Environment Variables
- Never commit `.env` files
- Use `.env.example` as template
- Set production secrets securely (ECS task definition environment variables)

### Rate Limiting
- Production: Strict limits (100 requests/15min)
- Development: Lenient limits (1000 requests/minute)
- Can disable in dev: `DISABLE_RATE_LIMIT=true`

### CORS Configuration
- Configured in `backend/src/index.ts`
- Uses `FRONTEND_URL` environment variable
- Supports multiple origins (local dev + Amplify production)
- Credentials enabled for cookie-based auth (if needed)

### Region Consistency
- **Critical:** All AWS resources must be in the same region (`us-east-2`)
- Database (RDS) and ECS must be in the same region for low latency
- ECR repository must be in the same region as ECS

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **No Test Data:** Database is empty, need to create mentors/sessions for testing
2. **Airtable Optional:** Integration works but is optional (warns if not configured)
3. **Email Service Optional:** Email sending works but is optional
4. **AI Matching:** Requires OpenAI API key for match reasoning

### Future Improvements
- [ ] Add seed script for test data
- [ ] Implement token blacklisting for logout
- [ ] Add request ID tracking for debugging
- [ ] Implement Redis-based rate limiting store
- [ ] Add comprehensive test suite
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement file upload for profile pictures
- [ ] Add real-time notifications (WebSockets)
- [x] Password reset flow (P0) - ✅ Complete
- [x] Match explanation (P0) - ✅ Complete
- [x] Automated session reminders (P0) - ✅ Complete
- [x] CSV export (P0) - ✅ Complete
- [x] Notification preferences (P0) - ✅ Complete
- [x] Notification delivery tracking (P0) - ✅ Complete
- [x] SMS notifications (P1) - ✅ Complete
- [x] In-app notification center UI (P1) - ✅ Complete
- [x] Bulk availability management (P1) - ✅ Complete
- [x] Advanced filtering and search (P1) - ✅ Complete
- [x] Favorite mentors (P1) - ✅ Complete

---

## 📚 Key Files Reference

### Backend
- `backend/src/index.ts` - Application entry point
- `backend/src/config/env.ts` - Environment configuration
- `backend/src/utils/userTransform.ts` - User format transformation
- `backend/src/middleware/rateLimiter.ts` - Rate limiting configuration
- `backend/prisma/schema.prisma` - Database schema

### Frontend
- `frontend/src/api/client.ts` - Axios client with interceptors
- `frontend/src/store/authStore.ts` - Authentication state management
- `frontend/src/types/index.ts` - TypeScript type definitions
- `frontend/src/components/ui/Input.tsx` - Form input component

### Documentation
- `prd-backend.md` - Backend product requirements
- `prd-frontend.md` - Frontend product requirements
- `prd.md` - Overall product requirements
- `integration-guide.md` - Frontend-backend integration guide

---

## 🎯 P0 & P1 Features Implementation (2025-11-12)

### P0 Features (Must-Have) - ✅ 100% Complete

1. ✅ **Password Reset Flow**
   - Endpoints: `POST /api/v1/auth/reset-password`, `POST /api/v1/auth/reset-password/confirm`
   - Database: `PasswordResetToken` model
   - Service: `AuthService.requestPasswordReset()`, `AuthService.confirmPasswordReset()`
   - Email: Sends reset link via email service
   - Security: Tokens expire in 1 hour, single-use only

2. ✅ **Match Explanation**
   - Endpoint: `GET /api/v1/matching/explain/:matchId`
   - Service: `MatchingService.getMatchExplanation()`
   - Returns: Match score, AI reasoning, breakdown (expertise, industry, stage, availability)
   - Supports: Session ID or mentor ID

3. ✅ **Automated Session Reminders**
   - Service: `SchedulerService` (runs every 5 minutes via `node-cron`)
   - Functionality: Sends 24-hour and 1-hour reminders
   - Channels: Email and SMS (respects user preferences)
   - Creates: In-app notifications for both mentor and mentee

4. ✅ **CSV Export**
   - Endpoint: `POST /api/v1/admin/export`
   - Supports: Sessions, Users, Feedback
   - Formats: CSV (with proper escaping) and JSON
   - Utility: `backend/src/utils/csvExport.ts`

5. ✅ **Notification Preferences**
   - Endpoints: `GET /api/v1/notification-preferences`, `PUT /api/v1/notification-preferences`
   - Database: `NotificationPreference` model
   - Service: `NotificationPreferenceService`
   - Features: Per-user, per-notification-type preferences (email/SMS)

6. ✅ **Notification Delivery Tracking**
   - Database: `NotificationDelivery` model
   - Tracks: Status (pending, sent, delivered, failed), channel, timestamps
   - Endpoints: `GET /api/v1/notifications/:id/delivery`, `GET /api/v1/notifications/delivery/stats`
   - Service: Enhanced `NotificationService` with delivery tracking

### P1 Features (Should-Have) - ✅ 100% Complete

1. ✅ **SMS Notifications**
   - Service: `SMSService` with Twilio integration
   - File: `backend/src/services/sms.service.ts`
   - Configuration: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
   - Status: Optional dependency (gracefully degrades if not configured)

2. ✅ **In-App Notification Center UI**
   - Component: `NotificationCenter.tsx`
   - Location: Navbar bell icon with unread count badge
   - Features: Real-time updates (30s refresh), mark as read, mark all as read, empty state
   - API: `frontend/src/api/notifications.ts`
   - Backend Routes: `GET /api/v1/notifications`, `PUT /api/v1/notifications/:id/read`, `PUT /api/v1/notifications/read-all`

3. ✅ **Bulk Availability Management**
   - Endpoint: `POST /api/v1/mentors/:id/availability/bulk`
   - Functionality: Create multiple availability slots in one request
   - Features: Transaction-based, option to replace existing availability
   - Route: `backend/src/routes/mentor.routes.ts`

4. ✅ **Advanced Filtering and Search**
   - Enhanced: `GET /api/v1/mentors` endpoint
   - Query Params: `search` (full-text), `sortBy` (matchScore, rating, availability, name), `sortOrder` (asc, desc), `favoritesOnly` (boolean)
   - Existing: `expertise`, `industry`, `available`, `minRating`
   - Route: `backend/src/routes/mentor.routes.ts`

5. ✅ **Favorite Mentors**
   - Database: `FavoriteMentor` model
   - Endpoints: `POST /api/v1/mentors/:id/favorite`, `DELETE /api/v1/mentors/:id/favorite`
   - Functionality: Mentor listings include `isFavorite` flag
   - Route: `backend/src/routes/mentor.routes.ts`

### New Services Added
- `SchedulerService` - Automated session reminders (P0)
- `SMSService` - SMS notifications via Twilio (P1)
- `NotificationPreferenceService` - User notification preferences (P0)
- Enhanced `NotificationService` - With delivery tracking (P0)
- Enhanced `MatchingService` - With match explanation (P0)
- Enhanced `AuthService` - With password reset (P0)

### New Routes Added
- `backend/src/routes/matching.routes.ts` - Match explanation endpoint
- `backend/src/routes/notificationPreference.routes.ts` - Notification preferences
- Enhanced `backend/src/routes/mentor.routes.ts` - Bulk availability, favorites, advanced filtering
- Enhanced `backend/src/routes/auth.routes.ts` - Password reset endpoints
- Enhanced `backend/src/routes/admin.routes.ts` - CSV export

### New Frontend Components
- `frontend/src/components/NotificationCenter.tsx` - Notification center modal
- Enhanced `frontend/src/components/layout/Navbar.tsx` - Notification bell with badge
- `frontend/src/api/notifications.ts` - Notification API client

## 🔄 Recent Changes Log

### 2025-01-12 (Deployment)
- ✅ Fixed dashboard data loading issues (improved API response format handling)
- ✅ Fixed navbar user name display (correctly parse nested user object from localStorage)
- ✅ Fixed profile page form population (array fields converted to comma-separated strings)
- ✅ Fixed MentorDetail page crashes (added optional chaining and fallback values)
- ✅ Fixed mentor availability endpoint (generates actual TimeSlot objects with ISO dates)
- ✅ Updated all deployment scripts for `us-east-2` region
- ✅ Created automated ECS setup script (`setup-ecs-backend.sh`)
- ✅ Created ECR setup script for `us-east-2` (`setup-ecr-us-east-2.sh`)
- ✅ Created comprehensive deployment documentation (`DEPLOYMENT_INSTRUCTIONS.md`)
- ✅ Deployed backend to AWS ECS Fargate in `us-east-2`
- ✅ Configured Application Load Balancer for backend
- ✅ Set up CloudWatch logging for ECS tasks
- ✅ Updated frontend API clients to handle nested response structures
- ✅ Enhanced error handling in dashboard components
- ✅ Fixed TypeScript build errors (unused variables)

### 2025-11-12
- ✅ Implemented all 6 P0 features (password reset, match explanation, automated reminders, CSV export, notification preferences, delivery tracking)
- ✅ Implemented all 5 P1 features (SMS notifications, notification center UI, bulk availability, advanced filtering, favorite mentors)
- ✅ Fixed server crash on validation errors
- ✅ Fixed refresh token not being sent in request body
- ✅ Added new database models: PasswordResetToken, NotificationPreference, NotificationDelivery, FavoriteMentor
- ✅ Created SchedulerService for automated reminders
- ✅ Created SMSService for SMS notifications
- ✅ Created NotificationPreferenceService
- ✅ Enhanced NotificationService with delivery tracking
- ✅ Enhanced MatchingService with match explanation
- ✅ Enhanced AuthService with password reset
- ✅ Tested all features (backend API and frontend UI)
- ✅ All features verified working

### 2025-01-12 (Earlier)
- ✅ Fixed TypeScript warnings (unused variables, return types)
- ✅ Fixed user profile structure mismatch (created transformation utility)
- ✅ Fixed rate limiting for development (increased limits)
- ✅ Fixed React Hook Form integration (Input component)
- ✅ Fixed frontend type safety (optional chaining, null checks)
- ✅ Verified authentication flow
- ✅ Tested mentors and sessions endpoints

---

## 📞 Quick Reference

### Database Connection
```bash
# Local PostgreSQL
DATABASE_URL=postgresql://andychuong@localhost:5432/office_hours_matching?schema=public

# Production (AWS RDS)
DATABASE_URL=postgresql://[username]:[password]@mentor-match-db.c1uuigcm4bd1.us-east-2.rds.amazonaws.com:5432/[database]
```

### Redis Connection
```bash
# Local Redis
REDIS_URL=redis://localhost:6379
```

### Service URLs

**Local Development:**
- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000
- **API Base:** http://localhost:8000/api/v1

**Production (AWS):**
- **Backend API:** `http://office-hours-alb-2030945038.us-east-2.elb.amazonaws.com/api/v1`
- **Frontend:** AWS Amplify (configured via `VITE_API_URL`)
- **Health Check:** `http://office-hours-alb-2030945038.us-east-2.elb.amazonaws.com/api/v1/health`

### Common Commands
```bash
# Backend
cd backend && npm run dev          # Start dev server
cd backend && npm run build        # Build TypeScript
cd backend && npx prisma migrate dev  # Run migrations
cd backend && npx prisma studio   # Open database GUI

# Frontend
cd frontend && npm run dev         # Start dev server
cd frontend && npm run build       # Build for production

# Deployment (AWS)
./docs/setup-ecr-us-east-2.sh     # Push Docker image to ECR
./docs/setup-ecs-backend.sh       # Create ECS resources

# Check ECS service status
aws ecs describe-services \
  --cluster office-hours-cluster \
  --services office-hours-backend-service \
  --region us-east-2

# View CloudWatch logs
aws logs tail /ecs/office-hours-backend --region us-east-2 --follow
```

---

**Note:** This memory bank should be updated whenever significant changes are made to the codebase, architecture, or configuration.

