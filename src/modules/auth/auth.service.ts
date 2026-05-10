import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { generateSecureToken, hashToken } from '../../utils/tokenHelper.js';

// In-memory store for password reset tokens (replace with DB/Redis in production)
const resetTokenStore = new Map<string, { userId: string; expiresAt: number }>();

export const registerUser = async (data: any) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw { statusCode: 400, message: 'Email already in use' };
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });

  logger.info('Auth: user registered', { userId: user.id, email: user.email });

  return generateTokens(user);
};

export const loginUser = async (data: any) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    logger.warn('Auth: login failed — user not found', { email: data.email });
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    logger.warn('Auth: login failed — wrong password', { userId: user.id });
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  logger.info('Auth: user logged in', { userId: user.id });
  return generateTokens(user);
};

export const logoutUser = async (userId: string) => {
  // In a stateless JWT system, logout is handled client-side by discarding the token.
  // If a refresh token blocklist/Redis store is used, invalidate it here.
  logger.info('Auth: user logged out', { userId });
  return null;
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) throw { statusCode: 404, message: 'User not found' };
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const refreshToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw { statusCode: 401, message: 'Invalid refresh token' };
    }
    // Rotation: issue new token pair on every refresh
    logger.info('Auth: token refreshed', { userId: user.id });
    return generateTokens(user);
  } catch (err: any) {
    if (err.statusCode) throw err;
    throw { statusCode: 401, message: 'Invalid or expired refresh token' };
  }
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent user enumeration
  if (!user) {
    logger.warn('Auth: forgot-password — email not found (silent)', { email });
    return null;
  }

  const rawToken = generateSecureToken();
  const hashed = hashToken(rawToken);
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  resetTokenStore.set(hashed, { userId: user.id, expiresAt });

  // In production, send this via email queue (BullMQ email job)
  logger.info('Auth: password reset token generated (mock email)', {
    userId: user.id,
    resetToken: rawToken, // only log in dev; remove in prod
  });

  return { message: 'If that email is registered, a reset link has been sent.' };
};

export const resetPassword = async (token: string, newPassword: string) => {
  const hashed = hashToken(token);
  const record = resetTokenStore.get(hashed);

  if (!record || record.expiresAt < Date.now()) {
    throw { statusCode: 400, message: 'Invalid or expired reset token' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: record.userId },
    data: { password: hashedPassword },
  });

  resetTokenStore.delete(hashed);
  logger.info('Auth: password reset successful', { userId: record.userId });
  return null;
};

export const mockGoogleLogin = async (data: any) => {
  // Mock Google login — replace with real Google OAuth token verification
  let user = await prisma.user.findUnique({ where: { email: 'mockgoogle@example.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Google User',
        email: 'mockgoogle@example.com',
        password: await bcrypt.hash(generateSecureToken(), 12),
      },
    });
  }
  logger.info('Auth: Google OAuth login (mock)', { userId: user.id });
  return generateTokens(user);
};

const generateTokens = (user: any) => {
  const payload = { userId: user.id, role: user.role };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY as any });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY as any });

  return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};
