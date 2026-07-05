import type { z } from 'zod';
import type {
  createBlogSchema,
  listBlogsQuerySchema,
  updateBlogSchema,
} from './blog.validators.js';

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
export type ListBlogsQuery = z.infer<typeof listBlogsQuerySchema>;
