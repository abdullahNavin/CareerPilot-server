import { Router } from 'express';
import * as careerController from './career.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createCareerSchema, updateCareerSchema, reviewSchema } from './career.schema.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', careerController.getAllCareers);
router.get('/:id', careerController.getCareerById);
router.get('/:id/reviews', careerController.getCareerReviews);

// Protected routes (Admin only)
router.post('/', authenticate, authorize(['ADMIN']), validate(createCareerSchema), careerController.createCareer);
router.patch('/:id', authenticate, authorize(['ADMIN']), validate(updateCareerSchema), careerController.updateCareer);
router.delete('/:id', authenticate, authorize(['ADMIN']), careerController.deleteCareer);

// Protected routes (Authenticated users)
router.post('/:id/reviews', authenticate, validate(reviewSchema), careerController.addCareerReview);

export default router;
