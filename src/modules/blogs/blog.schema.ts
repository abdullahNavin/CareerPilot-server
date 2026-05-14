import { z } from 'zod';

export const createBlogSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    category: z.string().min(1, 'Category is required'),
    slug: z.string().min(1).optional(),
    thumbnail: z.string().url().optional().or(z.literal('')),
    tags: z.array(z.string()).optional(),
    published: z.boolean().optional(),
  }),
});

export const updateBlogSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    category: z.string().optional(),
    slug: z.string().optional(),
    thumbnail: z.string().url().optional().or(z.literal('')),
    tags: z.array(z.string()).optional(),
    published: z.boolean().optional(),
  }),
});
