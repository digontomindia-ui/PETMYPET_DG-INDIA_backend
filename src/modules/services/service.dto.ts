import type { z } from 'zod';
import type {
  createServiceSchema,
  searchServicesQuerySchema,
  updateServiceSchema,
} from './service.validators.js';

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type SearchServicesQuery = z.infer<typeof searchServicesQuerySchema>;
