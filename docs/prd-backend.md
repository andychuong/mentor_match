# Backend PRD - Office Hours Matching Tool

**Organization:** Capital Factory  
**Project ID:** jcZVCmoXUgvC9nVOiJUZ_1762557598774  
**Technology Stack:** TypeScript, Ruby, Elixir, Go, or Python (choose one)

---

## 1. Executive Summary

The backend application for the Office Hours Matching Tool provides a robust, scalable API that powers the AI-driven matching system, manages user authentication, handles session booking, integrates with Airtable, and processes feedback. The backend is responsible for business logic, data persistence, external integrations, and AI-powered matching algorithms.

## 2. Technical Stack

### Recommended Stack Options:

**Option 1: TypeScript/Node.js**
- Runtime: Node.js
- Framework: Express.js, Fastify, or NestJS
- ORM: Prisma, TypeORM, or Sequelize
- Database: PostgreSQL (recommended)

**Option 2: Python**
- Framework: FastAPI, Django, or Flask
- ORM: SQLAlchemy, Django ORM
- Database: PostgreSQL

**Option 3: Ruby**
- Framework: Ruby on Rails
- ORM: ActiveRecord
- Database: PostgreSQL

**Option 4: Go**
- Framework: Gin, Echo, or Fiber
- Database: PostgreSQL with pgx or GORM

**Option 5: Elixir**
- Framework: Phoenix
- Database: PostgreSQL

### Common Requirements:
- **Database:** PostgreSQL (primary)
- **Cache:** Redis (for sessions, rate limiting)
- **Queue:** Redis Queue, RabbitMQ, or AWS SQS (for async tasks)
- **AI SDK:** Vercel AI SDK
- **Email Service:** SendGrid, AWS SES, or Mailgun
- **Cloud Platform:** AWS
- **Container:** Docker

## 3. Core Features & Requirements

### 3.1 Authentication & Authorization

#### P0 Requirements:
- JWT-based authentication
- User registration and login
- Password hashing (bcrypt or Argon2)
- Role-based access control (RBAC):
  - Roles: `mentor`, `mentee`, `admin`
- Token refresh mechanism
- Password reset flow (email-based)
- Session management

#### Implementation Details:
- JWT tokens with expiration (access: 15min, refresh: 7 days)
- Secure password requirements (min 8 chars, complexity)
- Rate limiting on authentication endpoints
- Audit logging for authentication events

### 3.2 User Management

#### P0 Requirements:
- User CRUD operations
- Profile management
- Role assignment
- User status (active, inactive, suspended)
- Profile synchronization with Airtable

#### Data Model:
```typescript
User {
  id: UUID
  email: string (unique)
  password_hash: string
  role: enum (mentor, mentee, admin)
  profile: {
    name: string
    bio: string
    profile_picture_url: string
    expertise_areas: string[] (for mentors)
    industry_focus: string[] (for mentees)
    startup_stage: string (for mentees)
  }
  airtable_sync_status: enum (synced, pending, error)
  airtable_record_id: string
  created_at: timestamp
  updated_at: timestamp
}
```

### 3.3 AI-Powered Matching System

#### P0 Requirements:
- Matching algorithm that considers:
  - Expertise areas alignment
  - Industry focus match
  - Startup stage relevance
  - Mentor availability
  - Historical session success (ratings)
- Match score calculation (0-100)
- Match reasoning explanation
- Real-time matching for mentee requests

#### Implementation Details:
- Use Vercel AI SDK for intelligent matching
- Vector embeddings for expertise/industry matching
- Weighted scoring system:
  - Expertise match: 40%
  - Industry match: 30%
  - Stage relevance: 20%
  - Availability: 10%
- Cache match results for performance
- Batch matching for bulk requests

#### API Endpoints:
- `POST /api/matching/match` - Get matches for a mentee
- `GET /api/matching/mentors/:mentorId/matches` - Get matches for a mentor
- `GET /api/matching/explain/:matchId` - Get match explanation

### 3.4 Session Management

#### P0 Requirements:
- Session CRUD operations
- Session status tracking (pending, confirmed, completed, cancelled)
- Availability management for mentors
- Session conflict detection
- Session reminders (email notifications)

#### Data Model:
```typescript
Session {
  id: UUID
  mentor_id: UUID (foreign key)
  mentee_id: UUID (foreign key)
  scheduled_at: timestamp
  duration_minutes: integer (default: 60)
  status: enum (pending, confirmed, completed, cancelled)
  topic: string
  notes: text
  match_score: float
  created_at: timestamp
  updated_at: timestamp
}

Availability {
  id: UUID
  mentor_id: UUID (foreign key)
  day_of_week: integer (0-6)
  start_time: time
  end_time: time
  timezone: string
  is_recurring: boolean
  valid_from: date
  valid_until: date
}
```

#### API Endpoints:
- `GET /api/sessions` - List sessions (with filters)
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions` - Create session request
- `PUT /api/sessions/:id` - Update session (accept/decline/reschedule)
- `DELETE /api/sessions/:id` - Cancel session
- `GET /api/mentors/:id/availability` - Get mentor availability
- `POST /api/mentors/:id/availability` - Set availability

### 3.5 Airtable Integration

#### P0 Requirements:
- Bi-directional sync with Airtable
- Profile synchronization:
  - User creation → Airtable record creation
  - Profile updates → Airtable record updates
  - Airtable updates → Database updates (webhook)
- Sync status tracking
- Error handling and retry logic
- Conflict resolution

#### Implementation Details:
- Airtable API client integration
- Webhook endpoint for Airtable updates
- Background job for sync operations
- Sync queue for handling high-volume updates
- Data mapping between database and Airtable schema

#### API Endpoints:
- `POST /api/webhooks/airtable` - Receive Airtable webhooks
- `POST /api/sync/airtable/:userId` - Manual sync trigger
- `GET /api/sync/status/:userId` - Get sync status

### 3.6 Feedback System

#### P0 Requirements:
- Feedback submission
- Feedback retrieval
- Feedback aggregation for mentors
- Feedback analytics for admins

#### Data Model:
```typescript
Feedback {
  id: UUID
  session_id: UUID (foreign key)
  mentor_id: UUID (foreign key)
  mentee_id: UUID (foreign key)
  rating: integer (1-5)
  written_feedback: text
  topics_covered: string[]
  helpfulness_rating: integer (1-5)
  would_recommend: boolean
  is_anonymous: boolean
  created_at: timestamp
}
```

#### API Endpoints:
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/:sessionId` - Get feedback for session
- `GET /api/mentors/:id/feedback` - Get all feedback for mentor
- `GET /api/feedback/stats/:mentorId` - Get feedback statistics

### 3.7 Notification System

#### P0 Requirements:
- Email notifications for:
  - Session confirmation
  - Session reminders (24h, 1h before)
  - Session cancellation
  - New session requests (for mentors)
  - Feedback submission confirmation
- Email template management
- Notification preferences per user
- Notification delivery tracking

#### P1 Requirements:
- SMS notifications (via Twilio or similar)
- In-app notification storage
- Push notifications (for future mobile app)

#### Implementation Details:
- Background job queue for email sending
- Email template engine (Handlebars, Mustache)
- Retry logic for failed notifications
- Rate limiting to prevent spam

### 3.8 Admin & Analytics

#### P0 Requirements:
- Platform analytics:
  - Total sessions booked
  - Mentor utilization rate
  - Average session rating
  - Active users count
  - Session volume over time
- User management endpoints
- Session management endpoints
- Data export functionality (CSV, JSON)

#### API Endpoints:
- `GET /api/admin/analytics` - Get platform analytics
- `GET /api/admin/analytics/sessions` - Session analytics
- `GET /api/admin/analytics/mentors` - Mentor utilization analytics
- `GET /api/admin/users` - List all users
- `GET /api/admin/sessions` - List all sessions
- `POST /api/admin/export` - Export data

### 3.9 Calendar Integration (P2)

#### Requirements:
- Google Calendar integration
- Outlook Calendar integration
- Two-way sync
- Automatic meeting invite generation
- Google Meet link generation

## 4. Database Schema

### Core Tables:
- `users` - User accounts and profiles
- `sessions` - Mentorship sessions
- `availability` - Mentor availability slots
- `feedback` - Session feedback
- `notifications` - Notification records
- `airtable_sync_log` - Airtable sync history
- `match_cache` - Cached match results

### Indexes:
- `users.email` (unique)
- `sessions.mentor_id`
- `sessions.mentee_id`
- `sessions.scheduled_at`
- `sessions.status`
- `availability.mentor_id`
- `feedback.session_id`
- `feedback.mentor_id`

## 5. API Design

### 5.1 RESTful API Principles
- RESTful endpoint naming
- HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Consistent response format
- Pagination for list endpoints
- Filtering and sorting support

### 5.2 Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "errors": []
}
```

### 5.3 Error Handling
- Standardized error responses
- Error codes for different error types
- Detailed error messages for debugging
- User-friendly error messages for clients

### 5.4 Rate Limiting
- Rate limits per endpoint
- Per-user rate limiting
- IP-based rate limiting for public endpoints
- Rate limit headers in responses

## 6. Security Requirements

### 6.1 Authentication & Authorization
- JWT token security
- Secure password storage
- Role-based access control
- API key management (for external integrations)

### 6.2 Data Security
- Encryption at rest (database)
- Encryption in transit (HTTPS/TLS)
- PII data encryption
- Secure secret management (AWS Secrets Manager, etc.)

### 6.3 API Security
- CORS configuration
- CSRF protection
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS prevention

### 6.4 Compliance
- GDPR compliance
- Data retention policies
- User data export (GDPR right to access)
- User data deletion (GDPR right to be forgotten)
- Privacy controls

## 7. Performance Requirements

### 7.1 Response Times
- API response time < 200ms (p95)
- Matching algorithm < 2 seconds
- Database queries < 100ms (p95)
- Email sending < 5 seconds (async)

### 7.2 Scalability
- Support 1000 concurrent users
- Horizontal scaling capability
- Database connection pooling
- Caching strategy (Redis)
- Background job processing

### 7.3 Optimization
- Database query optimization
- Index optimization
- API response caching
- Match result caching
- CDN for static assets

## 8. External Integrations

### 8.1 Airtable API
- Authentication (API key)
- Read/Write operations
- Webhook handling
- Error handling and retries

### 8.2 Email Service
- SendGrid / AWS SES / Mailgun
- Template management
- Delivery tracking
- Bounce handling

### 8.3 AI Service (Vercel AI SDK)
- API key management
- Request/response handling
- Error handling
- Rate limiting compliance

### 8.4 Calendar APIs (P2)
- Google Calendar API
- Microsoft Graph API (Outlook)
- OAuth 2.0 authentication
- Event creation and updates

## 9. Background Jobs & Queues

### 9.1 Job Types
- Email sending
- Airtable synchronization
- Session reminder notifications
- Match calculation (batch)
- Data export generation
- Analytics aggregation

### 9.2 Queue Management
- Job priority levels
- Retry logic with exponential backoff
- Dead letter queue for failed jobs
- Job status tracking

## 10. Logging & Monitoring

### 10.1 Logging
- Structured logging (JSON format)
- Log levels (DEBUG, INFO, WARN, ERROR)
- Request/response logging
- Error stack traces
- Audit logs for sensitive operations

### 10.2 Monitoring
- Application health checks
- Database connection monitoring
- API endpoint monitoring
- Error rate tracking
- Performance metrics
- Integration with AWS CloudWatch or similar

## 11. Testing Requirements

### 11.1 Unit Tests
- Business logic tests
- Utility function tests
- Model/entity tests
- Service layer tests

### 11.2 Integration Tests
- API endpoint tests
- Database integration tests
- External API integration tests (mocked)
- Authentication flow tests

### 11.3 E2E Tests
- Critical user flows
- Database transactions
- Background job processing

## 12. Deployment & Infrastructure

### 12.1 Deployment
- Containerized application (Docker)
- AWS deployment (ECS, EKS, or EC2)
- Environment configuration (dev, staging, prod)
- Database migrations
- Zero-downtime deployment strategy

### 12.2 Infrastructure
- Load balancing
- Auto-scaling configuration
- Database backups
- Disaster recovery plan
- CI/CD pipeline

## 13. Dependencies

- PostgreSQL database
- Redis cache
- Airtable API access
- Email service account
- Vercel AI SDK access
- AWS account and services
- Error tracking service (optional)

## 14. Out of Scope

- Mobile app backend
- Real-time chat functionality
- Video conferencing infrastructure
- Social media integration
- Advanced AI features (sentiment analysis, etc.)

## 15. Success Criteria

- All P0 features implemented and tested
- API response times meet requirements
- Security requirements met
- Integration with Airtable successful
- AI matching algorithm produces quality matches
- System handles 1000 concurrent users
- 99.9% uptime
- Comprehensive test coverage (>80%)

