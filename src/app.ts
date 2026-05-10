import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';
import routes from './routes/index.js';
import { errorHandler, requestLogger } from './middleware/error.middleware.js';
import { prisma } from './config/db.js';
import { redis } from './services/redis.service.js';
import { logger } from './config/logger.js';

const app = express();

// Security headers
app.use(helmet());

// CORS — whitelist allowed origins per PRD section 10
app.use(cors({
  origin: process.env['CORS_ORIGIN'] || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging (PRD section 7.2)
app.use(requestLogger);

// General rate limit (PRD section 7.1)
app.use('/api', apiLimiter);

// Health check — checks real DB + Redis connections (PRD section 13)
app.get('/api/health', async (req, res) => {
  let dbStatus = 'connected';
  let redisStatus = 'connected';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'disconnected';
    logger.error('Health check: database unreachable');
  }

  try {
    await redis.ping();
  } catch {
    redisStatus = 'disconnected';
    logger.error('Health check: redis unreachable');
  }

  const healthy = dbStatus === 'connected' && redisStatus === 'connected';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
});

// Mount all API routes
app.use('/api', routes);

// Global error handler
app.use(errorHandler);

export default app;
