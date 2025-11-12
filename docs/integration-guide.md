# Integration Guide - Frontend & Backend

**Organization:** Capital Factory  
**Project ID:** jcZVCmoXUgvC9nVOiJUZ_1762557598774

---

## 1. Overview

This document provides a comprehensive guide for integrating the frontend and backend applications of the Office Hours Matching Tool. It covers API contracts, authentication flow, data formats, error handling, and deployment coordination.

## 2. Prerequisites

Before integration, ensure both applications are:
- ✅ Independently developed and tested
- ✅ Following their respective PRDs
- ✅ Running in development environments
- ✅ Using compatible versions of shared dependencies

## 3. API Contract Specification

### 3.1 Base URL Configuration

**Development:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000` (or configured port)

**Staging:**
- Frontend: `https://staging-app.capitalfactory.com`
- Backend: `https://staging-api.capitalfactory.com`

**Production:**
- Frontend: `https://app.capitalfactory.com`
- Backend: `https://api.capitalfactory.com`

### 3.2 API Versioning

All API endpoints should be versioned:
- Base path: `/api/v1/`
- Example: `https://api.capitalfactory.com/api/v1/auth/login`

### 3.3 Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message",
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### 3.4 HTTP Status Codes

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST (resource created)
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

## 4. Authentication Integration

### 4.1 Authentication Flow

```
1. User submits login credentials
   ↓
2. Frontend → POST /api/v1/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Backend returns JWT tokens:
   {
     "accessToken": "eyJhbGc...",
     "refreshToken": "eyJhbGc...",
     "expiresIn": 900,
     "user": { ... }
   }
   ↓
5. Frontend stores tokens securely
   ↓
6. Frontend includes token in subsequent requests:
   Authorization: Bearer <accessToken>
   ↓
7. Backend validates token on each request
   ↓
8. If token expired, frontend uses refresh token:
   POST /api/v1/auth/refresh
```

### 4.2 Token Storage

**Recommended Approach:**
- Store `accessToken` in memory (React state) or httpOnly cookie
- Store `refreshToken` in httpOnly cookie (more secure)
- **DO NOT** store tokens in localStorage (XSS vulnerability)

**Frontend Implementation:**
```typescript
// Store tokens
const setAuthTokens = (accessToken: string, refreshToken: string) => {
  // Option 1: httpOnly cookies (set by backend)
  // Option 2: In-memory state
  setAccessToken(accessToken);
  // Store refresh token in httpOnly cookie via API call
};

// Include in requests
axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
```

### 4.3 Token Refresh

**Backend Endpoint:**
```
POST /api/v1/auth/refresh
Headers: {
  "Authorization": "Bearer <refreshToken>"
}
Response: {
  "accessToken": "new_access_token",
  "expiresIn": 900
}
```

**Frontend Implementation:**
```typescript
// Interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        // Retry original request
        error.config.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios.request(error.config);
      } else {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## 5. API Endpoints Specification

### 5.1 Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/v1/auth/login` | User login | `{ email, password }` | `{ accessToken, refreshToken, user }` |
| POST | `/api/v1/auth/logout` | User logout | - | `{ success: true }` |
| POST | `/api/v1/auth/refresh` | Refresh access token | - | `{ accessToken, expiresIn }` |
| POST | `/api/v1/auth/reset-password` | Request password reset | `{ email }` | `{ success: true }` |
| POST | `/api/v1/auth/reset-password/confirm` | Confirm password reset | `{ token, newPassword }` | `{ success: true }` |

### 5.2 User Endpoints

| Method | Endpoint | Description | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| GET | `/api/v1/users/me` | Get current user | ✅ | `{ user }` |
| PUT | `/api/v1/users/me` | Update current user | ✅ | `{ user }` |
| GET | `/api/v1/users/:id` | Get user by ID | ✅ | `{ user }` |

**User Object Schema:**
```typescript
{
  id: string;
  email: string;
  role: "mentor" | "mentee" | "admin";
  profile: {
    name: string;
    bio: string;
    profilePictureUrl: string;
    expertiseAreas?: string[]; // for mentors
    industryFocus?: string[]; // for mentees
    startupStage?: string; // for mentees
  };
  airtableSyncStatus: "synced" | "pending" | "error";
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### 5.3 Mentor Endpoints

| Method | Endpoint | Description | Auth Required | Query Params |
|--------|----------|-------------|---------------|--------------|
| GET | `/api/v1/mentors` | List mentors | ✅ | `?expertise=...&industry=...&available=true` |
| GET | `/api/v1/mentors/:id` | Get mentor details | ✅ | - |
| GET | `/api/v1/mentors/:id/availability` | Get availability | ✅ | `?startDate=...&endDate=...` |
| POST | `/api/v1/mentors/:id/availability` | Set availability | ✅ (mentor only) | - |
| GET | `/api/v1/mentors/:id/matches` | Get matches for mentor | ✅ (mentor only) | - |

**Mentor List Response:**
```json
{
  "success": true,
  "data": {
    "mentors": [
      {
        "id": "uuid",
        "profile": { ... },
        "matchScore": 85.5,
        "matchReasoning": "Strong expertise match in SaaS and B2B...",
        "availableSlots": [
          {
            "startTime": "2024-01-20T10:00:00Z",
            "endTime": "2024-01-20T11:00:00Z"
          }
        ],
        "averageRating": 4.7,
        "totalSessions": 45
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 5.4 Session Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| GET | `/api/v1/sessions` | List sessions | ✅ | Query: `?status=...&mentorId=...&menteeId=...` |
| GET | `/api/v1/sessions/:id` | Get session details | ✅ | - |
| POST | `/api/v1/sessions` | Create session | ✅ | `{ mentorId, scheduledAt, topic, notes }` |
| PUT | `/api/v1/sessions/:id` | Update session | ✅ | `{ status, scheduledAt, topic, notes }` |
| DELETE | `/api/v1/sessions/:id` | Cancel session | ✅ | - |

**Session Object Schema:**
```typescript
{
  id: string;
  mentorId: string;
  menteeId: string;
  mentor: { name: string; profilePictureUrl: string };
  mentee: { name: string; profilePictureUrl: string };
  scheduledAt: string; // ISO 8601
  durationMinutes: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  topic: string;
  notes: string;
  matchScore: number;
  createdAt: string;
  updatedAt: string;
}
```

### 5.5 Feedback Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| POST | `/api/v1/feedback` | Submit feedback | ✅ | `{ sessionId, rating, writtenFeedback, topicsCovered, helpfulnessRating, wouldRecommend, isAnonymous }` |
| GET | `/api/v1/feedback/:sessionId` | Get feedback | ✅ | - |
| GET | `/api/v1/mentors/:id/feedback` | Get mentor feedback | ✅ | - |
| GET | `/api/v1/feedback/stats/:mentorId` | Get feedback stats | ✅ | - |

### 5.6 Admin Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|--------------|
| GET | `/api/v1/admin/analytics` | Platform analytics | ✅ | admin |
| GET | `/api/v1/admin/analytics/sessions` | Session analytics | ✅ | admin |
| GET | `/api/v1/admin/analytics/mentors` | Mentor utilization | ✅ | admin |
| GET | `/api/v1/admin/users` | List users | ✅ | admin |
| GET | `/api/v1/admin/sessions` | List all sessions | ✅ | admin |
| POST | `/api/v1/admin/export` | Export data | ✅ | admin | `{ type: "sessions" | "users" | "feedback", format: "csv" | "json" }` |

## 6. Error Handling

### 6.1 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID` | 401 | Invalid credentials |
| `AUTH_EXPIRED` | 401 | Token expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Validation failed |
| `DUPLICATE_EMAIL` | 409 | Email already exists |
| `SESSION_CONFLICT` | 409 | Session time conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

### 6.2 Validation Errors

**Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required", "Email format is invalid"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

**Frontend Handling:**
```typescript
if (error.response?.data?.error?.code === 'VALIDATION_ERROR') {
  const validationErrors = error.response.data.error.details;
  // Display errors next to form fields
}
```

## 7. CORS Configuration

### 7.1 Backend CORS Setup

```typescript
// Backend CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000', // Development
    'https://staging-app.capitalfactory.com', // Staging
    'https://app.capitalfactory.com' // Production
  ],
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};
```

### 7.2 Frontend Axios Configuration

```typescript
// Frontend axios setup
axios.defaults.baseURL = process.env.REACT_APP_API_URL;
axios.defaults.withCredentials = true; // Include cookies
```

## 8. Environment Variables

### 8.1 Frontend Environment Variables

```env
# .env.development
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_ENV=development

# .env.production
REACT_APP_API_URL=https://api.capitalfactory.com/api/v1
REACT_APP_ENV=production
```

### 8.2 Backend Environment Variables

```env
# .env.development
PORT=8000
NODE_ENV=development
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID=...
EMAIL_SERVICE_API_KEY=...
FRONTEND_URL=http://localhost:3000

# .env.production
PORT=8000
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID=...
EMAIL_SERVICE_API_KEY=...
FRONTEND_URL=https://app.capitalfactory.com
```

## 9. Data Format Standards

### 9.1 Date/Time Format
- **Standard:** ISO 8601 format
- **Example:** `2024-01-15T10:30:00Z`
- **Timezone:** UTC (convert in frontend for display)

### 9.2 Pagination

**Request:**
```
GET /api/v1/mentors?page=1&limit=20&sort=matchScore&order=desc
```

**Response:**
```json
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 9.3 Filtering

**Request:**
```
GET /api/v1/mentors?expertise=SaaS,B2B&industry=Technology&available=true&minRating=4.0
```

**Backend Implementation:**
- Parse query parameters
- Validate filter values
- Apply filters to database query
- Return filtered results

## 10. Integration Testing Checklist

### 10.1 Authentication Flow
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Token refresh mechanism
- [ ] Logout functionality
- [ ] Protected route access
- [ ] Role-based access control

### 10.2 User Management
- [ ] Get current user profile
- [ ] Update user profile
- [ ] Profile picture upload
- [ ] Airtable sync status display

### 10.3 Matching & Sessions
- [ ] List available mentors
- [ ] Filter mentors by criteria
- [ ] View mentor details with match score
- [ ] Create session request
- [ ] Accept/decline session (mentor)
- [ ] View upcoming sessions
- [ ] Cancel session
- [ ] View session history

### 10.4 Feedback
- [ ] Submit feedback after session
- [ ] View submitted feedback
- [ ] View mentor feedback statistics

### 10.5 Admin Features
- [ ] View platform analytics
- [ ] Export session data
- [ ] Manage users
- [ ] View all sessions

### 10.6 Error Handling
- [ ] Network errors
- [ ] 401 Unauthorized handling
- [ ] 403 Forbidden handling
- [ ] 404 Not Found handling
- [ ] Validation error display
- [ ] Server error handling

## 11. Deployment Coordination

### 11.1 Deployment Order

1. **Backend First:**
   - Deploy backend to staging
   - Verify API endpoints
   - Test authentication
   - Update API documentation

2. **Frontend Second:**
   - Update frontend API base URL
   - Deploy frontend to staging
   - Test integration
   - Fix any integration issues

3. **Production:**
   - Deploy backend to production
   - Deploy frontend to production
   - Monitor for errors
   - Verify all features

### 11.2 Health Checks

**Backend Health Check:**
```
GET /api/v1/health
Response: {
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Frontend Health Check:**
- Verify API connectivity on app load
- Display connection status
- Handle API unavailability gracefully

### 11.3 Monitoring Integration

- Set up error tracking (Sentry, etc.)
- Monitor API response times
- Track authentication failures
- Monitor session booking success rate
- Alert on critical errors

## 12. Troubleshooting Guide

### 12.1 Common Issues

**CORS Errors:**
- Verify backend CORS configuration includes frontend URL
- Check credentials setting
- Verify preflight OPTIONS requests

**Authentication Failures:**
- Verify token format
- Check token expiration
- Verify refresh token flow
- Check cookie settings

**API Connection Issues:**
- Verify API base URL in frontend
- Check network connectivity
- Verify backend is running
- Check firewall/security group settings

**Data Format Mismatches:**
- Verify date/time format (ISO 8601)
- Check enum values match
- Verify nested object structure
- Check pagination format

## 13. Post-Integration Tasks

1. **Performance Testing:**
   - Load testing with expected user volume
   - API response time monitoring
   - Frontend performance optimization

2. **Security Audit:**
   - Token security review
   - CORS configuration review
   - Input validation review
   - Error message security (no sensitive data)

3. **Documentation:**
   - Update API documentation
   - Create integration runbook
   - Document known issues and workarounds

4. **Monitoring Setup:**
   - Configure error tracking
   - Set up performance monitoring
   - Create alerting rules
   - Set up logging aggregation

## 14. Support & Communication

- **API Changes:** Notify frontend team 48 hours in advance
- **Breaking Changes:** Coordinate deployment windows
- **Bug Reports:** Use shared issue tracking system
- **Status Updates:** Regular sync meetings during integration

---

## Appendix A: API Endpoint Summary

See detailed endpoint specifications in sections 5.1-5.6 above.

## Appendix B: Data Models

See data model schemas in:
- Backend PRD (Section 4)
- Frontend PRD (Section 5.1)

## Appendix C: Example Integration Code

### Frontend API Client Example

```typescript
// api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return apiClient.request(error.config);
      }
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Backend Route Example

```typescript
// routes/sessions.ts
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const { status, mentorId, menteeId } = req.query;
    const userId = req.user.id;
    const role = req.user.role;
    
    const sessions = await sessionService.getSessions({
      userId,
      role,
      filters: { status, mentorId, menteeId },
    });
    
    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
});
```

