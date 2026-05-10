import app from './app.js';
import { env } from './config/env.js';
import { initSocket } from './services/socket.service.js';
import { logger } from './config/logger.js';
import { prisma } from './config/db.js';
import { redis } from './services/redis.service.js';
import http from 'http';

const PORT = env.PORT;

const server = http.createServer(app);
initSocket(server);

const httpServer = server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});

// Graceful shutdown — close DB, Redis and HTTP server cleanly (PRD section 14)
const shutdown = async (signal: string) => {
  logger.info(`${signal} received: starting graceful shutdown`);
  httpServer.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected');
      redis.disconnect();
      logger.info('Redis disconnected');
    } catch (err) {
      logger.error('Error during shutdown', { err });
    }
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled rejections (PRD section 7.5 Sentry)
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { err });
  process.exit(1);
});
