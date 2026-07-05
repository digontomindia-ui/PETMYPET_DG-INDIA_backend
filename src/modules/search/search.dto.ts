import type { z } from 'zod';
import type { globalSearchQuerySchema, suggestQuerySchema } from './search.validators.js';

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>;
export type SuggestQuery = z.infer<typeof suggestQuerySchema>;
