import { prisma } from '../../config/db.js';

export const getPlatformStats = async () => {
  const [
    totalUsers,
    totalCareers,
    totalBlogs,
    totalJobs,
    totalAIRequests,
    usersByRole,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.career.count(),
    prisma.blog.count({ where: { published: true } }),
    prisma.jobApplication.count(),
    prisma.aIResult.count(),
    prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
  ]);

  return {
    totalUsers,
    totalCareers,
    totalBlogs,
    totalJobs,
    totalAIRequests,
    usersByRole: usersByRole.map(r => ({ role: r.role, count: r._count.id })),
  };
};

export const getAllUsersAdmin = async (filters: any) => {
  const { page = 1, limit = 20, role, search } = filters;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

export const changeUserRole = async (id: string, role: string) => {
  const validRoles = ['GUEST', 'USER', 'MENTOR', 'ADMIN'];
  if (!validRoles.includes(role)) throw { statusCode: 400, message: 'Invalid role' };

  return prisma.user.update({
    where: { id },
    data: { role: role as any },
    select: { id: true, name: true, email: true, role: true },
  });
};

export const deleteUserAdmin = async (id: string) => {
  await prisma.user.delete({ where: { id } });
  return null;
};

export const getAIUsageStats = async (filters: any) => {
  const { page = 1, limit = 20 } = filters;
  const skip = (Number(page) - 1) * Number(limit);

  const [byType, recent] = await Promise.all([
    prisma.aIResult.groupBy({
      by: ['type'],
      _count: { id: true },
    }),
    prisma.aIResult.findMany({
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return {
    byType: byType.map(t => ({ type: t.type, count: t._count.id })),
    recent,
  };
};

export const getAllBlogsAdmin = async (filters: any) => {
  const { page = 1, limit = 20, published } = filters;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (published !== undefined) where.published = published === 'true' || published === true;

  const [data, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.blog.count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};
