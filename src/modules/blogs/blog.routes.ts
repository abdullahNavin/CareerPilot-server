import { Router } from 'express';
import * as blogController from './blog.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createBlogSchema, updateBlogSchema } from './blog.schema.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', blogController.getBlogs);
router.get('/featured', blogController.getFeaturedBlogs);
router.get('/categories', blogController.getCategories);
router.get('/:slug', blogController.getBlogBySlug);

// Protected routes
router.post('/', authenticate, authorize(['ADMIN', 'MENTOR']), validate(createBlogSchema), blogController.createBlog);
router.patch('/:id', authenticate, authorize(['ADMIN', 'MENTOR']), validate(updateBlogSchema), blogController.updateBlog);
router.delete('/:id', authenticate, authorize(['ADMIN']), blogController.deleteBlog);

export default router;
