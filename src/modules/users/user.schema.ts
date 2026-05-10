import { z } from 'zod';

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    bio: z.string().optional(),
    education: z.array(z.any()).optional(),
    skills: z.array(z.string()).optional(),
    experience: z.array(z.any()).optional(),
    github: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    portfolio: z.string().url().optional().or(z.literal('')),
  }),
});
