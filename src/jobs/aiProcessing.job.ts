import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../services/redis.service.js';
import { logger } from '../config/logger.js';

// PRD section 7.4 — ai-processing queue (priority: High)
// Handles heavy AI tasks: roadmap generation, skill gap analysis

export interface AIProcessingJobData {
  userId: string;
  type: string;
  prompt: string;
}

export const aiProcessingQueue = new Queue<AIProcessingJobData>('ai-processing', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const aiProcessingWorker = new Worker<AIProcessingJobData>(
  'ai-processing',
  async (job: Job<AIProcessingJobData>) => {
    const { userId, type, prompt } = job.data;
    logger.info('AI processing job started', { jobId: job.id, userId, type });

    // Delegate to the AI service — import lazily to avoid circular deps
    const { processAIRequest } = await import('../modules/ai/ai.service.js');
    const result = await processAIRequest(userId, type as any, prompt);

    logger.info('AI processing job completed', { jobId: job.id, userId, type });
    return result;
  },
  { connection: redis, concurrency: 5 }
);

aiProcessingWorker.on('failed', (job, err) => {
  logger.error('AI processing job failed', { jobId: job?.id, err: err.message });
});
