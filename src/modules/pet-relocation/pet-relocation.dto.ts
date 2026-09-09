import type { z } from 'zod';
import type {
  createRelocationRequestSchema,
  listRelocationRequestsQuerySchema,
  updateRelocationStatusSchema,
} from './pet-relocation.validators.js';

export type CreateRelocationRequestInput = z.infer<typeof createRelocationRequestSchema>;
export type UpdateRelocationStatusInput = z.infer<typeof updateRelocationStatusSchema>;
export type ListRelocationRequestsQuery = z.infer<typeof listRelocationRequestsQuerySchema>;
