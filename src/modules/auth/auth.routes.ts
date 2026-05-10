import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema, googleAuthSchema } from './auth.schema.js';
import { authLimiter } from '../../middleware/rateLimiter.middleware.js';

const router = Router();

router.use(authLimiter);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refresh);
router.post('/google', validate(googleAuthSchema), authController.googleAuth);

export default router;
