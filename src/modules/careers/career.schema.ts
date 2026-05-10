import { z } from 'zod';

export const createCareerSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required'),
    salaryRange: z.string().min(1, 'Salary range is required'),
    location: z.string().min(1, 'Location is required'),
    demandLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  }),
});

export const updateCareerSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    salaryRange: z.string().optional(),
    location: z.string().optional(),
    demandLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  }),
});

export const reviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
    message: z.string().min(1, 'Message is required'),
  }),
});
