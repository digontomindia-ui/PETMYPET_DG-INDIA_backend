import { z } from 'zod';
import { REPORT_STATUSES } from './post.constants.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).max(10).default([]),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const createReportSchema = z.object({
  reason: z.string().min(1).max(1000),
});

export const updateReportStatusSchema = z.object({
  status: z.enum([REPORT_STATUSES.RESOLVED, REPORT_STATUSES.DISMISSED]),
});

export const listPostsQuerySchema = z.object({
  authorId: objectIdSchema.optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const listReportsQuerySchema = z.object({
  status: z
    .enum([REPORT_STATUSES.PENDING, REPORT_STATUSES.RESOLVED, REPORT_STATUSES.DISMISSED])
    .optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const paginationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({ id: objectIdSchema });
export const commentIdParamSchema = z.object({ commentId: objectIdSchema });
export const reportIdParamSchema = z.object({ id: objectIdSchema });
