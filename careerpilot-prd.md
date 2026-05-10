# CareerPilot AI — Backend PRD

---

## 1. Project Overview

**Project Name:** CareerPilot AI
**Type:** AI-Driven Full Stack SaaS Platform — Backend
**Architecture:** Modular REST API · Service-Based · Node.js + Express

The backend powers all business logic, AI integrations, data persistence, real-time features, background job processing, and security for the CareerPilot AI platform.

---

## 2. Backend Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Authentication | JWT (Access + Refresh Tokens) |
| Cache | Redis (Redis Cloud) |
| Queue | BullMQ |
| Logging | Winston |
| Real-Time | Socket.IO |
| File Storage | Cloudinary |
| AI Providers | Gemini API / OpenAI API |
| Error Tracking | Sentry |
| Security | Helmet.js, express-rate-limit |

---

## 3. Backend Architecture

### Architecture Style
- **Modular architecture** — each domain is a self-contained module
- **Service-based architecture** — controllers delegate to services
- **REST API** — consistent resource-based endpoints

### Folder Structure

```
src/
 ├── modules/
 │   ├── auth/
 │   ├── users/
 │   ├── careers/
 │   ├── blogs/
 │   ├── ai/
 │   ├── job-tracker/
 │   └── notifications/
 ├── middleware/
 │   ├── auth.middleware.ts
 │   ├── rateLimiter.middleware.ts
 │   ├── validate.middleware.ts
 │   └── error.middleware.ts
 ├── services/
 │   ├── redis.service.ts
 │   ├── cloudinary.service.ts
 │   ├── socket.service.ts
 │   └── ai.service.ts
 ├── utils/
 │   ├── apiResponse.ts
 │   ├── asyncHandler.ts
 │   └── tokenHelper.ts
 ├── config/
 │   ├── db.ts
 │   ├── redis.ts
 │   └── env.ts
 ├── interfaces/
 ├── routes/
 │   └── index.ts
 ├── prisma/
 │   └── schema.prisma
 ├── jobs/
 │   ├── aiProcessing.job.ts
 │   ├── email.job.ts
 │   └── resumeParsing.job.ts
 ├── logs/
 └── app.ts
```

Each module follows:
```
modules/[name]/
 ├── [name].controller.ts
 ├── [name].service.ts
 ├── [name].routes.ts
 ├── [name].schema.ts      # Zod validation
 └── [name].types.ts
```

---

## 4. Database Design

**Database:** PostgreSQL via Neon · **ORM:** Prisma

### Core Tables

#### Users
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Required |
| email | String | Unique |
| password | String | Bcrypt hashed |
| role | Enum | GUEST, USER, MENTOR, ADMIN |
| avatar | String? | Cloudinary URL |
| bio | String? | |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### Profiles
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK → Users |
| education | JSON | Array of education objects |
| skills | String[] | Skill tags |
| experience | JSON | Array of experience objects |
| github | String? | |
| linkedin | String? | |
| portfolio | String? | |

#### Careers
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| title | String | |
| description | String | |
| category | String | |
| salaryRange | String | e.g. "$80k–$130k" |
| location | String | |
| rating | Float | 0.0–5.0 |
| demandLevel | Enum | LOW, MEDIUM, HIGH |
| createdAt | DateTime | Auto |

#### JobApplications
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK → Users |
| companyName | String | |
| role | String | |
| status | Enum | APPLIED, INTERVIEW, OFFER, REJECTED |
| appliedDate | DateTime | |
| notes | String? | |
| updatedAt | DateTime | Auto |

#### Blogs
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| title | String | |
| slug | String | Unique |
| content | String | Rich text / Markdown |
| thumbnail | String | Cloudinary URL |
| authorId | UUID | FK → Users |
| category | String | |
| published | Boolean | Default false |
| createdAt | DateTime | Auto |

#### AIResults
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK → Users |
| type | Enum | RESUME, ROADMAP, INTERVIEW, SKILL_GAP, COVER_LETTER |
| prompt | String | |
| response | JSON | Structured AI output |
| createdAt | DateTime | Auto |

#### Notifications
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK → Users |
| title | String | |
| message | String | |
| isRead | Boolean | Default false |
| createdAt | DateTime | Auto |

#### Reviews
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK → Users |
| careerId | UUID? | FK → Careers (optional) |
| rating | Int | 1–5 |
| message | String | |
| createdAt | DateTime | Auto |

### Database Indexing
- `users.email` — unique index
- `blogs.slug` — unique index
- `jobApplications.userId` — index
- `aiResults.userId` + `type` — composite index
- `notifications.userId` + `isRead` — composite index

---

## 5. API Modules & Endpoints

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

**Paginated:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

### Auth Module

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
GET    /api/auth/me
POST   /api/auth/google          # Google OAuth
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

**Features:**
- JWT access token (15 min expiry)
- Refresh token (7 days, HTTP-only cookie)
- Bcrypt password hashing (salt rounds: 12)
- Role-based access control (RBAC)
- Google OAuth integration

---

### User Module

```
GET    /api/users                 # Admin only — list all users
GET    /api/users/:id             # Get user profile
PATCH  /api/users/:id             # Update user profile
DELETE /api/users/:id             # Admin or self
POST   /api/users/:id/avatar      # Upload avatar
GET    /api/users/:id/ai-results  # User's saved AI results
```

---

### Career Module

```
GET    /api/careers               # Public — list with filters/pagination
GET    /api/careers/:id           # Public — career detail
POST   /api/careers               # Admin only
PATCH  /api/careers/:id           # Admin only
DELETE /api/careers/:id           # Admin only
GET    /api/careers/:id/reviews   # Public
POST   /api/careers/:id/reviews   # Authenticated users
```

**Query Params (GET /api/careers):**
- `search`, `category`, `salaryMin`, `salaryMax`, `experience`, `location`
- `sort` (popular | salary | trending | newest)
- `page`, `limit`

---

### Blog Module

```
GET    /api/blogs                 # Public — paginated listing
GET    /api/blogs/:slug           # Public — blog detail
POST   /api/blogs                 # Admin/Mentor
PATCH  /api/blogs/:id             # Admin/Author
DELETE /api/blogs/:id             # Admin
GET    /api/blogs/featured        # Public — featured blogs
GET    /api/blogs/categories      # Public — all categories
```

---

### AI Module

```
POST   /api/ai/resume-analysis
POST   /api/ai/career-roadmap
POST   /api/ai/interview-chat
POST   /api/ai/skill-gap-analysis
POST   /api/ai/cover-letter
GET    /api/ai/results            # User's saved AI outputs
DELETE /api/ai/results/:id        # Delete saved result
```

**Features:**
- Streaming support (SSE for long AI responses)
- Redis caching for repeated prompts (TTL: 1 hour)
- Structured JSON responses from AI
- Retry logic (3 attempts with exponential backoff)
- Rate limiting (10 requests/hour per user on AI routes)
- Results persisted to AIResults table

**AI Response Caching Strategy:**
```
cache key: ai:{type}:{hash(prompt + userId)}
TTL: 3600s
```

---

### Job Tracker Module

```
GET    /api/job-tracker           # User's applications
POST   /api/job-tracker           # Add application
PATCH  /api/job-tracker/:id       # Update status/notes
DELETE /api/job-tracker/:id       # Remove application
GET    /api/job-tracker/stats     # Summary stats by status
```

---

### Notification Module

```
GET    /api/notifications         # User's notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
```

Real-time delivery via Socket.IO (see Section 9).

---

### Admin Module

```
GET    /api/admin/stats           # Platform-wide statistics
GET    /api/admin/users           # All users with filters
PATCH  /api/admin/users/:id/role  # Change user role
DELETE /api/admin/users/:id
GET    /api/admin/ai-usage        # AI request analytics
GET    /api/admin/blogs           # All blogs (published + draft)
```

---

## 6. Authentication & Authorization

### JWT Strategy
- **Access Token:** 15-minute expiry, stored in memory (client)
- **Refresh Token:** 7-day expiry, HTTP-only cookie
- **Rotation:** Refresh token rotated on every use

### RBAC Middleware
```typescript
// Usage example
router.delete('/:id', authenticate, authorize('ADMIN'), deleteUser);
```

Roles hierarchy: `ADMIN > MENTOR > USER > GUEST`

---

## 7. Advanced Backend Features

### 1. Rate Limiting (express-rate-limit)

| Route Group | Limit |
|---|---|
| Auth routes | 10 requests / 15 min |
| AI routes | 10 requests / 1 hour |
| General API | 100 requests / 15 min |
| File uploads | 20 requests / 1 hour |

---

### 2. Logging (Winston)

Log levels: `error` · `warn` · `info` · `debug`

What gets logged:
- All API requests (method, route, status, response time)
- Authentication events (login, logout, token refresh, failures)
- AI usage (endpoint, userId, token count, latency)
- Error stack traces
- Background job results

Log transports:
- Console (development)
- File: `logs/error.log` (errors only)
- File: `logs/combined.log` (all levels)

---

### 3. Caching (Redis)

| Data | TTL | Strategy |
|---|---|---|
| Career listings | 10 min | Cache-aside |
| Career detail | 30 min | Cache-aside |
| Blog listings | 10 min | Cache-aside |
| Blog detail | 60 min | Cache-aside |
| AI responses | 60 min | Content-hash key |
| User session | 7 days | Refresh token store |

Cache invalidation: write-through on admin create/update/delete.

---

### 4. Queue System (BullMQ)

**Queues:**

| Queue | Jobs | Priority |
|---|---|---|
| `ai-processing` | Heavy AI tasks (roadmap, skill gap) | High |
| `email` | Welcome emails, password reset, notifications | Medium |
| `resume-parsing` | PDF/DOCX text extraction | Medium |
| `notifications` | Push notifications delivery | Low |

**Queue Config:**
- Concurrency: 5 workers per queue
- Retry: 3 attempts, exponential backoff
- Dead letter queue for failed jobs after max retries

---

### 5. Error Tracking (Sentry)

Events tracked:
- Unhandled exceptions
- Promise rejections
- AI API failures
- Database connection errors
- Auth failures (brute force detection)

Context captured: userId, route, request body (sanitized), environment.

---

## 8. File Upload System (Cloudinary)

### Supported Uploads

| Type | Formats | Max Size |
|---|---|---|
| Resume | PDF, DOCX | 5 MB |
| Avatar | JPG, PNG, WebP | 2 MB |
| Blog Thumbnail | JPG, PNG, WebP | 3 MB |

### Upload Flow
1. Client sends multipart/form-data to Express endpoint
2. Multer middleware validates file type + size
3. File streamed directly to Cloudinary (no local disk storage)
4. Cloudinary URL stored in database

---

## 9. Real-Time Features (Socket.IO)

### Events

**Server → Client:**
- `notification:new` — new notification pushed to user
- `ai:stream:chunk` — streaming AI response chunk
- `ai:stream:done` — AI streaming complete
- `dashboard:update` — live dashboard metric update

**Client → Server:**
- `join:room` — user joins their personal room on connect
- `ai:chat:message` — send message to interview AI chat

### Connection Management
- JWT-authenticated connections
- User joins personal room: `room:userId`
- Admins join: `room:admin`
- Graceful disconnect handling

---

## 10. Security

| Measure | Implementation |
|---|---|
| Helmet.js | Secure HTTP headers |
| CORS | Whitelist allowed frontend origins |
| Rate Limiting | express-rate-limit per route group |
| Password Hashing | Bcrypt (12 rounds) |
| JWT Security | Short-lived access tokens, rotating refresh |
| Input Validation | Zod schemas on all request bodies |
| XSS Protection | Helmet + input sanitization |
| SQL Injection | Prisma parameterized queries |
| File Validation | Strict MIME type + size checks |

---

## 11. Validation (Zod)

All incoming requests validated via Zod middleware:
- Request body
- Query parameters
- Route params
- File upload metadata

```typescript
// Example middleware usage
router.post('/register', validate(registerSchema), authController.register);
```

---

## 12. Environment Variables (Backend)

```env
# Server
PORT=8000
NODE_ENV=production

# Database
DATABASE_URL=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_URL=

# AI Providers
OPENAI_API_KEY=
GEMINI_API_KEY=

# Cloudinary
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Sentry
SENTRY_DSN=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

---

## 13. Deployment

**Platform:** Render / Railway

**Requirements:**
- Dockerfile provided for containerized deployment
- Health check endpoint: `GET /api/health`
- Environment variables configured via platform dashboard
- Automatic restarts on crash (process manager)
- Zero-downtime deploy support

**Health Check Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## 14. Production Readiness Checklist

- [x] Winston logging (request, error, AI usage)
- [x] Global error handling middleware
- [x] Rate limiting on auth and AI routes
- [x] Zod validation on all endpoints
- [x] BullMQ queue for async operations
- [x] Redis caching for high-traffic data
- [x] Helmet.js security headers
- [x] CORS protection
- [x] Database indexing on queried fields
- [x] Sentry error monitoring
- [x] Health check endpoint
- [x] Graceful shutdown handling

---

## 15. Testing Strategy

**Tools:** Jest + Supertest

Test coverage:
- Auth controllers (register, login, token refresh)
- Service layer unit tests (business logic)
- API route integration tests
- Middleware tests (auth, validation, rate limit)
- AI module mock tests (mocked API responses)

---

## 16. Git & Development Workflow

**Branch Strategy:** `main` · `staging` · `develop` · `feature/*`

**Commit Convention:** `feat:` · `fix:` · `refactor:` · `style:` · `docs:`

---

*CareerPilot AI Backend PRD — v1.0*
