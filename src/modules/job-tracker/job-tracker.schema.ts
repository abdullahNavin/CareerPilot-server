import { z } from 'zod';

export const createJobSchema = z.object({
  body: z.object({
    companyName: z.string().min(1, 'Company name is required'),
    role: z.string().min(1, 'Role is required'),
    status: z.enum(['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']).optional(),
    appliedDate: z.string().datetime(),
    notes: z.string().optional(),
  }),
});

export const updateJobSchema = z.object({
  body: z.object({
    companyName: z.string().optional(),
    role: z.string().optional(),
    status: z.enum(['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']).optional(),
    appliedDate: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});
