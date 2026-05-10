import { Router } from 'express';
import * as userController from './user.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { updateUserSchema } from './user.schema.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN']), userController.getAllUsers);
router.get('/:id', userController.getUserProfile);
router.patch('/:id', validate(updateUserSchema), userController.updateUserProfile);
router.delete('/:id', userController.deleteUser);
router.post('/:id/avatar', userController.uploadAvatar);
router.get('/:id/ai-results', userController.getAiResults);

export default router;
