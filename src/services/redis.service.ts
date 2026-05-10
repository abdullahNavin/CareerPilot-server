import { Redis } from 'ioredis';
import { env } from '../config/env.js';

export const redis = new Redis(env.REDIS_URL);

redis.on('error', (err: Error) => {
  console.error('Redis error:', err);
});

export const getCache = async (key: string) => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCache = async (key: string, value: any, ttlSeconds: number) => {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
};

export const delCache = async (key: string) => {
  await redis.del(key);
};
