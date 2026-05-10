import { z } from 'zod';

// mostly no body needed except maybe for read all, which doesn't need schema
export const updateNotificationSchema = z.object({
  body: z.object({}).optional(),
});
