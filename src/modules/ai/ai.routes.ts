import { Router } from 'express';
import * as aiController from './ai.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { aiRequestSchema } from './ai.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { aiLimiter } from '../../middleware/rateLimiter.middleware.js';

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

router.post('/resume-analysis', validate(aiRequestSchema), aiController.resumeAnalysis);
router.post('/career-roadmap', validate(aiRequestSchema), aiController.careerRoadmap);
router.post('/interview-chat', validate(aiRequestSchema), aiController.interviewChat);
router.post('/skill-gap-analysis', validate(aiRequestSchema), aiController.skillGapAnalysis);
router.post('/cover-letter', validate(aiRequestSchema), aiController.coverLetter);

router.get('/results', aiController.getResults);
router.delete('/results/:id', aiController.deleteResult);

export default router;
