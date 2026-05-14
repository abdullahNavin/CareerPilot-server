import { z } from 'zod';

export const changeRoleSchema = z.object({
  body: z.object({
    role: z.enum(['GUEST', 'USER', 'MENTOR', 'ADMIN']),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).optional(),
    mentorStatus: z.enum(['NONE', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
    permissions: z.array(z.string()).optional(),
  }),
});

export const suspendUserSchema = z.object({
  body: z.object({
    suspended: z.boolean(),
  }),
});

export const updateMentorSchema = z.object({
  body: z.object({
    mentorStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']),
    permissions: z.array(z.string()).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).optional(),
  }),
});

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    message: z.string().min(5),
    type: z.enum(['PLATFORM_UPDATE', 'AI_USAGE_ALERT', 'SECURITY_ALERT', 'ADMIN_ANNOUNCEMENT']).default('ADMIN_ANNOUNCEMENT'),
    roleTarget: z.enum(['ALL', 'USER', 'MENTOR', 'ADMIN']).default('ALL'),
  }),
});

export const updateSupportTicketSchema = z.object({
  body: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedToId: z.string().uuid().nullable().optional(),
  }),
});

export const resolveReportSchema = z.object({
  body: z.object({
    status: z.enum(['REVIEWED', 'RESOLVED', 'DISMISSED']),
  }),
});
