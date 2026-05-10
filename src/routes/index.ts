import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import careerRoutes from '../modules/careers/career.routes.js';
import aiRoutes from '../modules/ai/ai.routes.js';
import jobTrackerRoutes from '../modules/job-tracker/job-tracker.routes.js';
import blogRoutes from '../modules/blogs/blog.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/careers', careerRoutes);
router.use('/ai', aiRoutes);
router.use('/job-tracker', jobTrackerRoutes);
router.use('/blogs', blogRoutes);
router.use('/notifications', notificationRoutes);

export default router;
