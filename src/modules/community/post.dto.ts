import type { z } from 'zod';
import type {
  createCommentSchema,
  createPostSchema,
  createReportSchema,
  listPostsQuerySchema,
  listReportsQuerySchema,
  paginationQuerySchema,
  updateReportStatusSchema,
} from './post.validators.js';

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
