import type { z } from 'zod';
import type {
  cancelRelocationRequestSchema,
  createRelocationRequestSchema,
  listRelocationRequestsQuerySchema,
  updateRelocationStatusSchema,
} from './pet-relocation.validators.js';

export type CreateRelocationRequestInput = z.infer<typeof createRelocationRequestSchema>;
export type UpdateRelocationStatusInput = z.infer<typeof updateRelocationStatusSchema>;
export type CancelRelocationRequestInput = z.infer<typeof cancelRelocationRequestSchema>;
export type ListRelocationRequestsQuery = z.infer<typeof listRelocationRequestsQuerySchema>;
