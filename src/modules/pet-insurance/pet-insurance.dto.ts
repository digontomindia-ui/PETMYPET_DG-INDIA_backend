import type { z } from 'zod';
import type {
  createInsuranceApplicationSchema,
  listInsuranceApplicationsQuerySchema,
  listMyApplicationsQuerySchema,
  updateApplicationStatusSchema,
} from './pet-insurance.validators.js';

export type CreateInsuranceApplicationInput = z.infer<typeof createInsuranceApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type ListInsuranceApplicationsQuery = z.infer<typeof listInsuranceApplicationsQuerySchema>;
export type ListMyApplicationsQuery = z.infer<typeof listMyApplicationsQuerySchema>;
