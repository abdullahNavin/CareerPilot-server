import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  // Server
  PORT: z.string().default('8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),

  // Database (PRD section 12)
  DATABASE_URL: z.string(),

  // JWT (PRD section 12)
  JWT_SECRET: z.string().default('change-me-jwt-secret'),
  JWT_REFRESH_SECRET: z.string().default('change-me-refresh-secret'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Redis (PRD section 12)
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // AI Providers (PRD section 12) — optional, mocked when absent
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // Cloudinary (PRD section 12) — optional, mocked when absent
  CLOUDINARY_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Sentry (PRD section 12) — optional
  SENTRY_DSN: z.string().optional(),

  // Google OAuth (PRD section 12) — optional, mocked when absent
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Email / SMTP (PRD section 12) — optional, mocked when absent
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
