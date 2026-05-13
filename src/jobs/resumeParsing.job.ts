import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../services/redis.service.js';
import { logger } from '../config/logger.js';

// PRD section 7.4 — resume-parsing queue (priority: Medium)
// Extracts text from PDF/DOCX resume files uploaded via Cloudinary

export interface ResumeParsingJobData {
  userId: string;
  fileUrl: string;
  fileName: string;
}

export const resumeParsingQueue = new Queue<ResumeParsingJobData>('resume-parsing', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1500 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const resumeParsingWorker = new Worker<ResumeParsingJobData>(
  'resume-parsing',
  async (job: Job<ResumeParsingJobData>) => {
    const { userId, fileUrl, fileName } = job.data;
    logger.info('Resume parsing job started', { jobId: job.id, userId, fileName });

    // TODO: Integrate with a PDF/DOCX text extraction library
    // e.g. pdf-parse or mammoth for DOCX
    // Then pass extracted text to the AI resume analysis endpoint
    const mockExtractedText = `Extracted resume text from ${fileName} (mock)`;

    logger.info('Resume parsing job completed', { jobId: job.id, userId, extractedLength: mockExtractedText.length });
    return { extractedText: mockExtractedText };
  },
  { connection: redis, concurrency: 5 }
);

resumeParsingWorker.on('failed', (job, err) => {
  logger.error('Resume parsing job failed', { jobId: job?.id, err: err.message });
});

export const enqueueResumeParsing = (userId: string, fileUrl: string, fileName: string) =>
  resumeParsingQueue.add('parse', { userId, fileUrl, fileName });
