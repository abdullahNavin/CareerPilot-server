import crypto from 'crypto';

/**
 * Generates a secure random token (hex string).
 * Used for password reset tokens, email verification, etc.
 */
export const generateSecureToken = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hashes a token for secure storage in the database.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
