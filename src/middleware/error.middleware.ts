import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// HTTP request logger middleware — logs method, route, status, response time (PRD section 7.2)
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      route: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
    });
  });
  next();
};

// Global error handler
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    logger.warn('Validation error', { route: req.originalUrl, issues: err.issues });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error(message, { route: req.originalUrl, statusCode, stack: err.stack });
  } else {
    logger.warn(message, { route: req.originalUrl, statusCode });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
