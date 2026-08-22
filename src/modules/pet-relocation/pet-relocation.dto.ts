import type { z } from 'zod';
import type {
  createRelocationRequestSchema,
  listMyRelocationRequestsQuerySchema,
  listRelocationRequestsQuerySchema,
  updateRelocationStatusSchema,
} from './pet-relocation.validators.js';

export type CreateRelocationRequestInput = z.infer<typeof createRelocationRequestSchema>;
export type UpdateRelocationStatusInput = z.infer<typeof updateRelocationStatusSchema>;
export type ListRelocationRequestsQuery = z.infer<typeof listRelocationRequestsQuerySchema>;
export type ListMyRelocationRequestsQuery = z.infer<typeof listMyRelocationRequestsQuerySchema>;
