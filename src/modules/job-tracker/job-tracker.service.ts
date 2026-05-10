import { prisma } from '../../config/db.js';

export const getUserJobs = async (userId: string) => {
  return prisma.jobApplication.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
};

export const createJob = async (userId: string, data: any) => {
  return prisma.jobApplication.create({
    data: {
      ...data,
      userId,
    },
  });
};

export const updateJob = async (id: string, userId: string, data: any) => {
  const job = await prisma.jobApplication.findUnique({ where: { id } });
  if (!job || job.userId !== userId) {
    throw { statusCode: 404, message: 'Job not found or forbidden' };
  }

  return prisma.jobApplication.update({
    where: { id },
    data,
  });
};

export const deleteJob = async (id: string, userId: string) => {
  const job = await prisma.jobApplication.findUnique({ where: { id } });
  if (!job || job.userId !== userId) {
    throw { statusCode: 404, message: 'Job not found or forbidden' };
  }

  await prisma.jobApplication.delete({ where: { id } });
  return null;
};

export const getJobStats = async (userId: string) => {
  const stats = await prisma.jobApplication.groupBy({
    by: ['status'],
    where: { userId },
    _count: { id: true },
  });

  const formattedStats = {
    APPLIED: 0,
    INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0,
    total: 0,
  };

  stats.forEach((stat) => {
    formattedStats[stat.status] = stat._count.id;
    formattedStats.total += stat._count.id;
  });

  return formattedStats;
};
