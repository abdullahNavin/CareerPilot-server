import { z } from 'zod';

export const changeRoleSchema = z.object({
  body: z.object({
    role: z.enum(['GUEST', 'USER', 'MENTOR', 'ADMIN']),
  }),
});
