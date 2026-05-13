import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { changeRoleSchema } from './admin.schema.js';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize(['ADMIN']));

router.get('/stats', adminController.getPlatformStats);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/role', validate(changeRoleSchema), adminController.changeUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/ai-usage', adminController.getAIUsage);
router.get('/blogs', adminController.getAllBlogs);

export default router;
