import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.string().default('8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().default('mock-jwt-secret'),
  JWT_REFRESH_SECRET: z.string().default('mock-refresh-secret'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  // Add other variables here as needed. Making them optional for now since they are mocked.
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
