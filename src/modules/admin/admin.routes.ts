import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  changeRoleSchema,
  createAnnouncementSchema,
  resolveReportSchema,
  suspendUserSchema,
  updateMentorSchema,
  updateSupportTicketSchema,
  updateUserSchema,
} from './admin.schema.js';

const router = Router();

router.use(authenticate, authorize(['ADMIN']));

router.get('/overview', adminController.getOverview);
router.get('/stats', adminController.getPlatformStats);

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id', validate(updateUserSchema), adminController.updateUser);
router.patch('/users/:id/role', validate(changeRoleSchema), adminController.changeUserRole);
router.patch('/users/:id/suspend', validate(suspendUserSchema), adminController.suspendUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/mentors', adminController.getMentors);
router.patch('/mentors/:id', validate(updateMentorSchema), adminController.updateMentor);

router.get('/careers', adminController.getCareers);
router.get('/blogs', adminController.getAllBlogs);

router.get('/ai-usage', adminController.getAIUsage);
router.get('/reports', adminController.getReports);
router.patch('/reports/:id', validate(resolveReportSchema), adminController.resolveReport);

router.get('/notifications', adminController.getNotifications);
router.post('/notifications', validate(createAnnouncementSchema), adminController.sendAnnouncement);

router.get('/metrics', adminController.getPlatformMetrics);
router.get('/support', adminController.getSupportTickets);
router.patch('/support/:id', validate(updateSupportTicketSchema), adminController.updateSupportTicket);

router.get('/security', adminController.getSecurityEvents);
router.get('/roles', adminController.getRolePermissionManagement);

export default router;
