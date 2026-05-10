import { prisma } from '../../config/db.js';

export const getAllCareers = async (filters: any) => {
  const { search, category, page = 1, limit = 10, sort = 'newest' } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'popular') orderBy = { rating: 'desc' };
  else if (sort === 'trending') orderBy = { demandLevel: 'desc' }; // approximation

  const [data, total] = await Promise.all([
    prisma.career.findMany({ where, skip, take: Number(limit), orderBy }),
    prisma.career.count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCareerById = async (id: string) => {
  const career = await prisma.career.findUnique({
    where: { id },
  });
  if (!career) throw { statusCode: 404, message: 'Career not found' };
  return career;
};

export const createCareer = async (data: any) => {
  return prisma.career.create({ data });
};

export const updateCareer = async (id: string, data: any) => {
  return prisma.career.update({
    where: { id },
    data,
  });
};

export const deleteCareer = async (id: string) => {
  await prisma.career.delete({ where: { id } });
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
    data: {
      careerId: id,
      userId,
      rating: data.rating,
      message: data.message,
    },
  });

  // Update career rating
  const reviews = await prisma.review.findMany({ where: { careerId: id } });
  const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
  
  await prisma.career.update({
    where: { id },
    data: { rating: avgRating },
  });

  return review;
};
