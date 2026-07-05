import type { z } from 'zod';
import type {
  addMedicalRecordSchema,
  addVaccinationSchema,
  createPetSchema,
  updatePetSchema,
} from './pet.validators.js';

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
export type AddMedicalRecordInput = z.infer<typeof addMedicalRecordSchema>;
export type AddVaccinationInput = z.infer<typeof addVaccinationSchema>;
