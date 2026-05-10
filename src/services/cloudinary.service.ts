import { logger } from '../config/logger.js';

/**
 * Mock Cloudinary service.
 * Replace with real Cloudinary SDK calls when CLOUDINARY_* env vars are available.
 *
 * Real implementation would use:
 *   import { v2 as cloudinary } from 'cloudinary';
 *   cloudinary.config({ cloud_name, api_key, api_secret });
 */

export type UploadType = 'avatar' | 'resume' | 'blog_thumbnail';

const MOCK_BASE_URL = 'https://res.cloudinary.com/mock-careerpilot';

export const uploadFile = async (
  fileBuffer: Buffer,
  fileName: string,
  type: UploadType,
  userId: string
): Promise<string> => {
  // TODO: Replace with real Cloudinary upload when keys are configured
  logger.info('Cloudinary upload (mock)', { type, userId, fileName });

  const folder = type === 'avatar' ? 'avatars' : type === 'resume' ? 'resumes' : 'thumbnails';
  const mockUrl = `${MOCK_BASE_URL}/${folder}/${userId}-${Date.now()}-${fileName}`;

  return mockUrl;
};

export const deleteFile = async (publicId: string): Promise<void> => {
  // TODO: Replace with real Cloudinary deletion
  logger.info('Cloudinary delete (mock)', { publicId });
};
