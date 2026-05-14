import {
  MentorStatus,
  ModerationStatus,
  NotificationTarget,
  NotificationType,
  Role,
  SecuritySeverity,
  SupportStatus,
  UserStatus,
  type Prisma,
} from '@prisma/client';
import { prisma } from '../../config/db.js';
import { redis } from '../../services/redis.service.js';
import { emitNotification } from '../../services/socket.service.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const rolePermissionDefaults: Record<string, string[]> = {
  ADMIN: [
    'users.read',
    'users.write',
    'mentors.review',
    'careers.write',
    'blogs.write',
    'analytics.read',
    'reports.resolve',
    'notifications.send',
    'platform.metrics.read',
    'security.read',
    'roles.manage',
  ],
  MENTOR: [
    'students.read',
    'sessions.write',
    'roadmaps.read',
  ],
  USER: [
    'profile.write',
    'applications.write',
    'ai.use',
  ],
  GUEST: [],
};

function paginate(query: Record<string, unknown>) {
  const page = Number(query.page ?? DEFAULT_PAGE);
  const limit = Number(query.limit ?? DEFAULT_LIMIT);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildPagination(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

function buildUserSearch(search?: unknown): Prisma.UserWhereInput | undefined {
  if (!search || typeof search !== 'string') return undefined;

  return {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ],
  };
}

function startOfDayOffset(daysAgo: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function dailySeries<T extends { createdAt: Date }>(
  items: T[],
  label: string,
  days = 14,
) {
  return Array.from({ length: days }, (_, index) => {
    const date = startOfDayOffset(days - index - 1);
    const dayKey = date.toISOString().slice(0, 10);
    return {
      date: dayKey,
      [label]: items.filter((item) => item.createdAt.toISOString().slice(0, 10) === dayKey).length,
    };
  });
}

function mergeDailySeries(
  left: Array<{ date: string; [key: string]: number | string }>,
  right: Array<{ date: string; [key: string]: number | string }>,
) {
  return left.map((item, index) => ({
    ...item,
    ...right[index],
  }));
}

async function createSecurityEvent(input: {
  userId?: string | null;
  type: string;
  severity: SecuritySeverity;
  message: string;
  ipAddress?: string | null;
}) {
  await prisma.securityEvent.create({
    data: {
      type: input.type,
      severity: input.severity,
      message: input.message,
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
    },
  });
}

export const getPlatformStats = async () => {
  const [
    totalUsers,
    totalCareers,
    totalBlogs,
    totalJobs,
    totalAIRequests,
    totalMentors,
    activeUsers,
    resumeAnalyses,
    interviewSessions,
    usersByRole,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.career.count(),
    prisma.blog.count({ where: { published: true } }),
    prisma.jobApplication.count(),
    prisma.aIUsageLog.count(),
    prisma.user.count({ where: { role: Role.MENTOR } }),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.aIUsageLog.count({ where: { feature: 'RESUME' } }),
    prisma.aIUsageLog.count({ where: { feature: 'INTERVIEW' } }),
    prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
  ]);

  const previousWeek = startOfDayOffset(14);
  const currentWeek = startOfDayOffset(7);
  const [previousUsers, currentUsers] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: previousWeek, lt: currentWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: currentWeek } } }),
  ]);

  const growthRate = previousUsers === 0
    ? currentUsers > 0 ? 100 : 0
    : Number((((currentUsers - previousUsers) / previousUsers) * 100).toFixed(1));

  return {
    totalUsers,
    totalMentors,
    activeUsers,
    totalCareers,
    totalBlogs,
    totalJobs,
    totalAIRequests,
    resumeAnalyses,
    interviewSessions,
    growthRate,
    usersByRole: usersByRole.map((item) => ({ role: item.role, count: item._count.id })),
  };
};

export const getAdminOverview = async () => {
  const stats = await getPlatformStats();
  const [recentUsers, aiLogs, careers] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: startOfDayOffset(13) } },
      select: { createdAt: true, lastActiveAt: true },
    }),
    prisma.aIUsageLog.findMany({
      where: { createdAt: { gte: startOfDayOffset(13) } },
      select: { createdAt: true, feature: true },
    }),
    prisma.career.findMany({
      select: { category: true, createdAt: true },
    }),
  ]);

  const userGrowth = dailySeries(recentUsers, 'users');
  const dailyActiveUsers = Array.from({ length: 14 }, (_, index) => {
    const date = startOfDayOffset(13 - index);
    const dayKey = date.toISOString().slice(0, 10);
    return {
      date: dayKey,
      activeUsers: recentUsers.filter((user) => user.lastActiveAt.toISOString().slice(0, 10) === dayKey).length,
    };
  });

  const aiUsageTrend = Array.from({ length: 14 }, (_, index) => {
    const date = startOfDayOffset(13 - index);
    const dayKey = date.toISOString().slice(0, 10);
    return {
      date: dayKey,
      requests: aiLogs.filter((log) => log.createdAt.toISOString().slice(0, 10) === dayKey).length,
    };
  });

  const categoryMap = new Map<string, number>();
  for (const career of careers) {
    categoryMap.set(career.category, (categoryMap.get(career.category) ?? 0) + 1);
  }

  return {
    stats,
    charts: {
      userGrowth,
      aiUsageTrend,
      dailyActiveUsers,
      careerCategoryPopularity: Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count })),
    },
  };
};

export const getAllUsersAdmin = async (filters: Record<string, unknown>) => {
  const { page, limit, skip } = paginate(filters);
  const where: Prisma.UserWhereInput = {
    ...(filters.role ? { role: filters.role as Role } : {}),
    ...(filters.status ? { status: filters.status as UserStatus } : {}),
    ...buildUserSearch(filters.search),
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { profile: true },
    }),
    prisma.user.count({ where }),
  ]);

  return { data: data.map(({ password, ...user }) => user), pagination: buildPagination(total, page, limit) };
};

export const getUserAdminById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      jobApplications: { orderBy: { updatedAt: 'desc' }, take: 10 },
      aiResults: { orderBy: { createdAt: 'desc' }, take: 10 },
      notifications: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!user) throw { statusCode: 404, message: 'User not found' };
  const { password, ...safeUser } = user;
  return safeUser;
};

export const updateUserAdmin = async (id: string, data: {
  name?: string;
  email?: string;
  status?: UserStatus;
  mentorStatus?: MentorStatus;
  permissions?: string[];
}) => {
  const user = await prisma.user.update({
    where: { id },
    data,
    include: { profile: true },
  });

  const { password, ...safeUser } = user;
  return safeUser;
};

export const changeUserRole = async (id: string, role: string) => {
  const validRoles = Object.values(Role);
  if (!validRoles.includes(role as Role)) {
    throw { statusCode: 400, message: 'Invalid role' };
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      role: role as Role,
      mentorStatus: role === Role.MENTOR ? MentorStatus.APPROVED : MentorStatus.NONE,
      permissions: rolePermissionDefaults[role] ?? [],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      mentorStatus: true,
      status: true,
    },
  });

  await createSecurityEvent({
    userId: id,
    type: 'ROLE_UPDATED',
    severity: SecuritySeverity.MEDIUM,
    message: `User role changed to ${role}.`,
  });

  return user;
};

export const suspendUserAdmin = async (id: string, suspended: boolean) => {
  const user = await prisma.user.update({
    where: { id },
    data: {
      status: suspended ? UserStatus.SUSPENDED : UserStatus.ACTIVE,
      suspendedAt: suspended ? new Date() : null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      suspendedAt: true,
    },
  });

  await createSecurityEvent({
    userId: id,
    type: suspended ? 'USER_SUSPENDED' : 'USER_RESTORED',
    severity: suspended ? SecuritySeverity.HIGH : SecuritySeverity.LOW,
    message: suspended ? 'User account suspended by admin.' : 'User account restored by admin.',
  });

  return user;
};

export const deleteUserAdmin = async (id: string) => {
  await prisma.user.delete({ where: { id } });
  await createSecurityEvent({
    userId: id,
    type: 'USER_DELETED',
    severity: SecuritySeverity.CRITICAL,
    message: 'User account deleted by admin.',
  });
  return null;
};

export const getMentorOverview = async (filters: Record<string, unknown>) => {
  const { page, limit, skip } = paginate(filters);
  const where: Prisma.UserWhereInput = {
    OR: [
      { role: Role.MENTOR },
      { mentorStatus: { not: MentorStatus.NONE } },
    ],
    ...(filters.mentorStatus ? { mentorStatus: filters.mentorStatus as MentorStatus } : {}),
    ...buildUserSearch(filters.search),
  };

  const [mentors, total, totalMentors, pendingApprovals, activeMentors] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        aiUsageLogs: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: Role.MENTOR } }),
    prisma.user.count({ where: { mentorStatus: MentorStatus.PENDING } }),
    prisma.user.count({ where: { role: Role.MENTOR, status: UserStatus.ACTIVE } }),
  ]);

  return {
    metrics: {
      totalMentors,
      pendingApprovals,
      activeMentors,
    },
    data: mentors.map(({ password, aiUsageLogs, ...mentor }) => ({
      ...mentor,
      performance: {
        sessions: aiUsageLogs.filter((log) => log.feature === 'INTERVIEW').length,
        aiAssistUsage: aiUsageLogs.length,
      },
    })),
    pagination: buildPagination(total, page, limit),
  };
};

export const updateMentorAdmin = async (id: string, data: {
  mentorStatus: MentorStatus;
  permissions?: string[];
  status?: UserStatus;
}) => {
  const shouldPromote = data.mentorStatus === MentorStatus.APPROVED;
  const shouldDemote = data.mentorStatus === MentorStatus.REJECTED;

  const mentor = await prisma.user.update({
    where: { id },
    data: {
      mentorStatus: data.mentorStatus,
      ...(data.status ? { status: data.status } : {}),
      ...(shouldPromote ? { role: Role.MENTOR } : shouldDemote ? { role: Role.USER } : {}),
      ...(data.permissions ? { permissions: data.permissions } : {}),
      ...(data.status === UserStatus.SUSPENDED ? { suspendedAt: new Date() } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      mentorStatus: true,
      permissions: true,
    },
  });

  await createSecurityEvent({
    userId: id,
    type: 'MENTOR_STATUS_UPDATED',
    severity: SecuritySeverity.MEDIUM,
    message: `Mentor status changed to ${data.mentorStatus}.`,
  });

  return mentor;
};

export const getCareersAdmin = async (filters: Record<string, unknown>) => {
  const { page, limit, skip } = paginate(filters);
  const where: Prisma.CareerWhereInput = {
    ...(filters.category ? { category: String(filters.category) } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: String(filters.search), mode: 'insensitive' } },
            { description: { contains: String(filters.search), mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.career.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { reviews: true },
    }),
    prisma.career.count({ where }),
  ]);

  return { data, pagination: buildPagination(total, page, limit) };
};

export const getAIUsageStats = async (filters: Record<string, unknown>) => {
  const { page, limit, skip } = paginate(filters);
  const logs = await prisma.aIUsageLog.findMany({
    where: { createdAt: { gte: startOfDayOffset(13) } },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const [recent, totalRequests, failedRequests] = await Promise.all([
    prisma.aIUsageLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.aIUsageLog.count(),
    prisma.aIUsageLog.count({ where: { success: false } }),
  ]);

  const byFeature = new Map<string, number>();
  const dailyMap = new Map<string, { requests: number; tokens: number; cost: number; failures: number }>();
  let totalTokens = 0;

  for (const log of logs) {
    totalTokens += log.tokensUsed;
    byFeature.set(log.feature, (byFeature.get(log.feature) ?? 0) + 1);
    const dayKey = log.createdAt.toISOString().slice(0, 10);
    const cost = Number(((log.tokensUsed / 1000) * 0.0005).toFixed(4));
    const existing = dailyMap.get(dayKey) ?? { requests: 0, tokens: 0, cost: 0, failures: 0 };
    existing.requests += 1;
    existing.tokens += log.tokensUsed;
    existing.cost = Number((existing.cost + cost).toFixed(4));
    existing.failures += log.success ? 0 : 1;
    dailyMap.set(dayKey, existing);
  }

  const dailyUsage = Array.from({ length: 14 }, (_, index) => {
    const dayKey = startOfDayOffset(13 - index).toISOString().slice(0, 10);
    const entry = dailyMap.get(dayKey) ?? { requests: 0, tokens: 0, cost: 0, failures: 0 };
    return { date: dayKey, ...entry };
  });

  return {
    summary: {
      totalRequests,
      failedRequests,
      totalTokens,
      estimatedCost: Number(((totalTokens / 1000) * 0.0005).toFixed(2)),
      mostUsedTool: Array.from(byFeature.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'RESUME',
    },
    charts: {
      dailyUsage,
      toolUsage: Array.from(byFeature.entries()).map(([feature, count]) => ({ feature, count })),
      costAnalytics: dailyUsage.map((item) => ({ date: item.date, cost: item.cost })),
    },
    recent,
    pagination: buildPagination(totalRequests, page, limit),
  };
};

export const getAllBlogsAdmin = async (filters: Record<string, unknown>) => {
  const { page, limit, skip } = paginate(filters);
  const where: Prisma.BlogWhereInput = {
    ...(filters.published !== undefined ? { published: filters.published === 'true' || filters.published === true } : {}),
    ...(filters.category ? { category: String(filters.category) } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: String(filters.search), mode: 'insensitive' } },
            { slug: { contains: String(filters.search), mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.blog.count({ where }),
  ]);

  return {
    data,
    pagination: buildPagination(total, page, limit),
  };
};

export const getReports = async (filters: Record<string, unknown>) => {
  const { page, limit, skip } = paginate(filters);
  const where: Prisma.ModerationReportWhereInput = {
    ...(filters.status ? { status: filters.status as ModerationStatus } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.moderationReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        targetUser: { select: { id: true, name: true, email: true } },
        targetBlog: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.moderationReport.count({ where }),
  ]);

  const [open, resolved] = await Promise.all([
    prisma.moderationReport.count({ where: { status: ModerationStatus.OPEN } }),
    prisma.moderationReport.count({ where: { status: ModerationStatus.RESOLVED } }),
  ]);

  return {
    summary: { open, resolved, total },
    data,
    pagination: buildPagination(total, page, limit),
  };
};

export const resolveReport = async (id: string, status: ModerationStatus) => {
  return prisma.moderationReport.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === ModerationStatus.RESOLVED || status === ModerationStatus.DISMISSED ? new Date() : null,
    },
  });
};

export const getNotificationsAdmin = async () => {
  const [recent, unread] = await Promise.all([
    prisma.notification.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  return { unread, recent };
};

export const createAnnouncement = async (input: {
  title: string;
  message: string;
  type: NotificationType;
  roleTarget: NotificationTarget;
}) => {
  const roleMap: Record<NotificationTarget, Role[] | null> = {
    ALL: null,
    USER: [Role.USER],
    MENTOR: [Role.MENTOR],
    ADMIN: [Role.ADMIN],
  };

  const recipients = await prisma.user.findMany({
    ...(roleMap[input.roleTarget] ? { where: { role: { in: roleMap[input.roleTarget]! } } } : {}),
    select: { id: true },
  });

  if (!recipients.length) {
    return { created: 0 };
  }

  await prisma.notification.createMany({
    data: recipients.map((recipient) => ({
      userId: recipient.id,
      title: input.title,
      message: input.message,
      type: input.type,
      roleTarget: input.roleTarget,
    })),
  });

  const notifications = await prisma.notification.findMany({
    where: { title: input.title, message: input.message },
    orderBy: { createdAt: 'desc' },
    take: recipients.length,
  });

  const byUserId = new Map<string, typeof notifications[number]>();
  for (const notification of notifications) {
    if (notification.userId) {
      byUserId.set(notification.userId, notification);
    }
  }

  for (const recipient of recipients) {
    const notification = byUserId.get(recipient.id);
    if (notification) emitNotification(recipient.id, notification);
  }

  return { created: recipients.length };
};

export const getPlatformMetrics = async () => {
  const now = new Date();
  let redisHealthy = true;
  let dbHealthy = true;

  try {
    await redis.ping();
  } catch {
    redisHealthy = false;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbHealthy = false;
  }

  const [recentAiLogs, activeSessions, errorsLastDay] = await Promise.all([
    prisma.aIUsageLog.findMany({
      where: { createdAt: { gte: startOfDayOffset(6) } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.count({
      where: {
        lastActiveAt: { gte: new Date(Date.now() - 1000 * 60 * 30) },
      },
    }),
    prisma.securityEvent.count({
      where: {
        createdAt: { gte: startOfDayOffset(1) },
        severity: { in: [SecuritySeverity.HIGH, SecuritySeverity.CRITICAL] },
      },
    }),
  ]);

  const metricsTrend = Array.from({ length: 7 }, (_, index) => {
    const date = startOfDayOffset(6 - index);
    const dayKey = date.toISOString().slice(0, 10);
    const dayLogs = recentAiLogs.filter((log) => log.createdAt.toISOString().slice(0, 10) === dayKey);
    const avgResponseTime = dayLogs.length
      ? Math.round(dayLogs.reduce((sum, log) => sum + log.responseTime, 0) / dayLogs.length)
      : 0;
    return {
      date: dayKey,
      apiResponseTime: avgResponseTime,
      errorRate: dayLogs.length ? Number((((dayLogs.filter((log) => !log.success).length / dayLogs.length) * 100)).toFixed(1)) : 0,
    };
  });

  return {
    cards: {
      apiResponseTime: metricsTrend.at(-1)?.apiResponseTime ?? 0,
      queueBacklog: 0,
      redisHealthy,
      serverUptime: Math.floor(process.uptime()),
      errorRate: metricsTrend.at(-1)?.errorRate ?? 0,
      activeSessions,
      databaseHealthy: dbHealthy,
      errorsLastDay,
      checkedAt: now.toISOString(),
    },
    charts: metricsTrend,
  };
};

export const getSupportTickets = async (filters: Record<string, unknown>) => {
  const { page, limit, skip } = paginate(filters);
  const where: Prisma.SupportTicketWhereInput = {
    ...(filters.status ? { status: filters.status as SupportStatus } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    data,
    pagination: buildPagination(total, page, limit),
  };
};

export const updateSupportTicket = async (id: string, data: {
  status?: SupportStatus;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedToId?: string | null;
}) => {
  return prisma.supportTicket.update({
    where: { id },
    data: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
      ...(data.assignedToId !== undefined ? { assignedToId: data.assignedToId } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
};

export const getSecurityEvents = async (filters: Record<string, unknown>) => {
  const { page, limit, skip } = paginate(filters);
  const where: Prisma.SecurityEventWhereInput = {
    ...(filters.severity ? { severity: filters.severity as SecuritySeverity } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.securityEvent.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.securityEvent.count({ where }),
  ]);

  return {
    data,
    pagination: buildPagination(total, page, limit),
  };
};

export const getRolePermissionManagement = async () => {
  const admins = await prisma.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.MENTOR] } },
    select: { id: true, name: true, email: true, role: true, permissions: true, status: true },
    orderBy: { role: 'asc' },
  });

  return {
    defaults: rolePermissionDefaults,
    admins,
  };
};
