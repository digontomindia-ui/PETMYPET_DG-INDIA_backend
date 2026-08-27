import type { z } from 'zod';
import type { listBreedsQuerySchema } from './breed.validators.js';

export type ListBreedsQuery = z.infer<typeof listBreedsQuerySchema>;
