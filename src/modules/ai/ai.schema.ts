import { z } from 'zod';

export const aiRequestSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, 'Prompt is required'),
  }),
});
