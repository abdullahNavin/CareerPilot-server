import { prisma } from '../../config/db.js';
import { AIResultType } from '@prisma/client';
import { getCache, setCache } from '../../services/redis.service.js';
import crypto from 'crypto';

const mockAIResponse = async (prompt: string, type: string) => {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    summary: `Mock summary for ${type} based on prompt: ${prompt.substring(0, 20)}...`,
    details: ['Point 1', 'Point 2', 'Point 3'],
  };
};

export const processAIRequest = async (userId: string, type: AIResultType, prompt: string) => {
  const hash = crypto.createHash('md5').update(prompt + userId).digest('hex');
  const cacheKey = `ai:${type}:${hash}`;

  // Check cache
  const cachedResponse = await getCache(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Call mock AI
  const response = await mockAIResponse(prompt, type);

  // Save to DB
  await prisma.aIResult.create({
    data: {
      userId,
      type,
      prompt,
      response,
    },
  });

  // Cache response for 1 hour
  await setCache(cacheKey, response, 3600);

  return response;
};

export const getUserAIResults = async (userId: string) => {
  return prisma.aIResult.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const deleteAIResult = async (id: string, userId: string) => {
  const result = await prisma.aIResult.findUnique({ where: { id } });
  if (!result || result.userId !== userId) {
    throw { statusCode: 404, message: 'Result not found or forbidden' };
  }
  await prisma.aIResult.delete({ where: { id } });
  return null;
};
