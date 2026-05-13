import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../services/redis.service.js';
import { logger } from '../config/logger.js';

// PRD section 7.4 — email queue (priority: Medium)
// Handles: welcome emails, password reset links, notification emails

export type EmailJobType = 'welcome' | 'password_reset' | 'notification';

export interface EmailJobData {
  to: string;
  type: EmailJobType;
  payload: Record<string, any>;
}

export const emailQueue = new Queue<EmailJobData>('email', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const emailWorker = new Worker<EmailJobData>(
  'email',
  async (job: Job<EmailJobData>) => {
    const { to, type, payload } = job.data;
    logger.info('Email job started', { jobId: job.id, to, type });

    // TODO: Integrate with a real SMTP provider (Nodemailer / SendGrid / AWS SES)
    // using SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS from env
    logger.info('Email sent (mock)', { to, type, payload });
  },
  { connection: redis, concurrency: 5 }
);

emailWorker.on('failed', (job, err) => {
  logger.error('Email job failed', { jobId: job?.id, err: err.message });
});

// Helper to enqueue a welcome email after user registration
export const sendWelcomeEmail = (to: string, name: string) =>
  emailQueue.add('welcome', { to, type: 'welcome', payload: { name } });

// Helper to enqueue a password reset email
export const sendPasswordResetEmail = (to: string, token: string) =>
  emailQueue.add('password_reset', { to, type: 'password_reset', payload: { token } });
