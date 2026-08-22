import type { z } from 'zod';
import type { discoverQuerySchema, petIdQuerySchema, swipeSchema } from './pet-companion.validators.js';

export type DiscoverQuery = z.infer<typeof discoverQuerySchema>;
export type SwipeInput = z.infer<typeof swipeSchema>;
export type PetIdQuery = z.infer<typeof petIdQuerySchema>;
