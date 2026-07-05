import type { z } from 'zod';
import type {
  createProductSchema,
  searchProductsQuerySchema,
  updateProductSchema,
} from './product.validators.js';

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type SearchProductsQuery = z.infer<typeof searchProductsQuerySchema>;
