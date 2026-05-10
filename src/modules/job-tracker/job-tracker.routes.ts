import { Router } from 'express';
import * as jobController from './job-tracker.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createJobSchema, updateJobSchema } from './job-tracker.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', jobController.getJobs);
router.post('/', validate(createJobSchema), jobController.createJob);
router.get('/stats', jobController.getStats);
router.patch('/:id', validate(updateJobSchema), jobController.updateJob);
router.delete('/:id', jobController.deleteJob);

export default router;
