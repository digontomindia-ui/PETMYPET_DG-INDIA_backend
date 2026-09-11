import type { z } from 'zod';
import type {
  cancelInsuranceApplicationSchema,
  createInsuranceApplicationSchema,
  listInsuranceApplicationsQuerySchema,
  updateApplicationStatusSchema,
} from './pet-insurance.validators.js';

export type CreateInsuranceApplicationInput = z.infer<typeof createInsuranceApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type CancelInsuranceApplicationInput = z.infer<typeof cancelInsuranceApplicationSchema>;
export type ListInsuranceApplicationsQuery = z.infer<typeof listInsuranceApplicationsQuerySchema>;
