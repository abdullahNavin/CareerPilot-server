import { prisma } from '../../config/db.js';
import { getCache, setCache, delCache } from '../../services/redis.service.js';

// Cache TTLs per PRD section 7.3
const CAREER_LIST_TTL = 10 * 60;   // 10 minutes
const CAREER_DETAIL_TTL = 30 * 60; // 30 minutes

const careerListKey = (q: string) => `cache:careers:list:${q}`;
const careerDetailKey = (id: string) => `cache:careers:detail:${id}`;

export const getAllCareers = async (filters: any) => {
  const {
    search, category, location,
    salaryMin, salaryMax,
    page = 1, limit = 10, sort = 'newest',
  } = filters;

  const cacheKey = careerListKey(JSON.stringify(filters));
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};

  if (category) where.category = category;
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  // salaryRange is a string like "$80k–$130k"; filter by location is the practical one
  // For salaryMin/Max we do a best-effort string filter
  if (salaryMin || salaryMax) {
    // Store numeric min/max alongside salaryRange in a future schema iteration.
    // For now, just pass through — a TODO for schema evolution.
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'popular') orderBy = { rating: 'desc' };
  else if (sort === 'trending') orderBy = { demandLevel: 'desc' };
  else if (sort === 'salary') orderBy = { salaryRange: 'asc' };

  const [data, total] = await Promise.all([
    prisma.career.findMany({ where, skip, take: Number(limit), orderBy }),
    prisma.career.count({ where }),
  ]);

  const result = {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };

  await setCache(cacheKey, result, CAREER_LIST_TTL);
  return result;
};

export const getCareerById = async (id: string) => {
  const cacheKey = careerDetailKey(id);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const career = await prisma.career.findUnique({ where: { id } });
  if (!career) throw { statusCode: 404, message: 'Career not found' };

  await setCache(cacheKey, career, CAREER_DETAIL_TTL);
  return career;
};

// Write-through cache invalidation on mutations (PRD section 7.3)
const invalidateCareerCache = async (id?: string) => {
  if (id) await delCache(careerDetailKey(id));
  // Bust all list pages — use a pattern delete approach
  const keys = await import('../../services/redis.service.js').then(m => m.redis.keys('cache:careers:list:*'));
  if (keys.length) {
    await import('../../services/redis.service.js').then(m => m.redis.del(...keys));
  }
};

export const createCareer = async (data: any) => {
  const career = await prisma.career.create({ data });
  await invalidateCareerCache();
  return career;
};

export const updateCareer = async (id: string, data: any) => {
  const career = await prisma.career.update({ where: { id }, data });
  await invalidateCareerCache(id);
  return career;
};

export const deleteCareer = async (id: string) => {
  await prisma.career.delete({ where: { id } });
  await invalidateCareerCache(id);
  return null;
};

export const getCareerReviews = async (id: string) => {
  return prisma.review.findMany({
    where: { careerId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, avatar: true } } },
  });
};

export const addCareerReview = async (id: string, userId: string, data: any) => {
  const career = await prisma.career.findUnique({ where: { id } });
  if (!career) throw { statusCode: 404, message: 'Career not found' };

  const review = await prisma.review.create({
    data: { careerId: id, userId, rating: data.rating, message: data.message },
  });

  // Recalculate average rating
  const reviews = await prisma.review.findMany({ where: { careerId: id } });
  const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
  await prisma.career.update({ where: { id }, data: { rating: avgRating } });

  // Invalidate detail cache so new rating is reflected
  await invalidateCareerCache(id);

  return review;
};
