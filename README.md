# CareerPilot Server

## Project Overview

CareerPilot is a backend API for a career coaching platform. It provides user authentication, job tracking, blog management, notifications, and AI-powered career support. The server is built with TypeScript, Express, Prisma, and PostgreSQL, and integrates Redis and BullMQ for caching and background job processing.

## Tech Stack

- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- Socket.io
- Zod for request validation
- Winston for logging
- Helmet and rate limiting for security
- dotenv for environment configuration

## AI Features

The AI module powers several career coaching workflows using a generative language API.

Supported AI endpoints:

- `POST /api/ai/resume-analysis`
  - Analyzes resume content and provides actionable feedback.
- `POST /api/ai/career-roadmap`
  - Generates a personalized career roadmap and next steps.
- `POST /api/ai/interview-chat`
  - Simulates interview coaching and mock interview questions.
- `POST /api/ai/skill-gap-analysis`
  - Identifies skill gaps and suggests areas for improvement.
- `POST /api/ai/cover-letter`
  - Creates or improves cover letter content.
- `GET /api/ai/results`
  - Fetches saved AI result history for the authenticated user.

AI request handling includes:

- structured JSON responses with `summary`, `details`, and `recommendations`
- provider fallback handling when the live AI service is unavailable
- per-user AI result persistence via Prisma

## Setup Instructions

### Prerequisites

- Node.js (recommended version compatible with `pnpm`)
- `pnpm`
- PostgreSQL database
- Redis server

### Install dependencies

```bash
pnpm install
```

### Environment Variables

Create a `.env` file at the project root with the required settings.

Example values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/careerpilot
REDIS_URL=redis://localhost:6379
PORT=4000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_google_gemini_api_key
```

### Database setup

Generate Prisma client and apply migrations:

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

If you prefer to push the current schema without generating a migration:

```bash
pnpm prisma:push
```

### Run in development

```bash
pnpm run dev
```

### Build for production

```bash
pnpm run build
pnpm start
```

## Notes

- The API is mounted under `/api`.
- AI routes are protected and require authentication.
- Health checks are available at `/api/health`.
- The project uses Redis for caching and job support, and BullMQ for queued background jobs.

## Project Structure

- `src/app.ts` — Express app setup
- `src/server.ts` — server bootstrap
- `src/config` — database, environment, and logger configuration
- `src/modules` — feature controllers, routes, services, and schemas
- `src/services` — shared services such as Cloudinary, Redis, and sockets
- `src/utils` — helper utilities and response formatting
- `prisma/schema.prisma` — database schema

---

For more details on API routes and module behavior, explore the `src/modules` folder.
