import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { postController } from './post.controller.js';
import {
  commentIdParamSchema,
  createCommentSchema,
  createPostSchema,
  createReportSchema,
  idParamSchema,
  listPostsQuerySchema,
  listReportsQuerySchema,
  paginationQuerySchema,
  reportIdParamSchema,
  updateReportStatusSchema,
} from './post.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const postRoutes = Router();

/**
 * @openapi
 * /posts:
 *   get:
 *     tags: [Community]
 *     summary: List posts
 *     parameters:
 *       - name: authorId
 *         in: query
 *         schema: { type: string }
 *       - name: page
 *         in: query
 *         schema: { type: string }
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200: { description: Posts retrieved successfully }
 */
postRoutes.get(
  '/',
  optionalAuthenticate,
  validate({ query: listPostsQuerySchema }),
  postController.list,
);

/**
 * @openapi
 * /posts/bookmarks/me:
 *   get:
 *     tags: [Community]
 *     summary: List posts bookmarked by the current user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: string }
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200: { description: Bookmarked posts retrieved successfully }
 */
postRoutes.get(
  '/bookmarks/me',
  authenticate,
  validate({ query: paginationQuerySchema }),
  postController.listBookmarked,
);

/**
 * @openapi
 * /posts/reports:
 *   get:
 *     tags: [Community]
 *     summary: List post reports (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string }
 *       - name: page
 *         in: query
 *         schema: { type: string }
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200: { description: Reports retrieved successfully }
 */
postRoutes.get(
  '/reports',
  ...adminOnly,
  validate({ query: listReportsQuerySchema }),
  postController.listReports,
);
/**
 * @openapi
 * /posts/reports/{id}:
 *   patch:
 *     tags: [Community]
 *     summary: Resolve or dismiss a post report (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Report status updated successfully }
 */
postRoutes.patch(
  '/reports/:id',
  ...adminOnly,
  validate({ params: reportIdParamSchema, body: updateReportStatusSchema }),
  postController.resolveReport,
);

/**
 * @openapi
 * /posts/{id}:
 *   get:
 *     tags: [Community]
 *     summary: Get a post by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Post retrieved successfully }
 */
postRoutes.get(
  '/:id',
  optionalAuthenticate,
  validate({ params: idParamSchema }),
  postController.getById,
);
/**
 * @openapi
 * /posts:
 *   post:
 *     tags: [Community]
 *     summary: Create a new post
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Post created successfully }
 */
postRoutes.post('/', authenticate, validate({ body: createPostSchema }), postController.create);
/**
 * @openapi
 * /posts/{id}:
 *   delete:
 *     tags: [Community]
 *     summary: Delete own post
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Post deleted successfully }
 */
postRoutes.delete('/:id', authenticate, validate({ params: idParamSchema }), postController.remove);
/**
 * @openapi
 * /posts/{id}/moderate:
 *   delete:
 *     tags: [Community]
 *     summary: Remove a post via moderation (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Post removed successfully }
 */
postRoutes.delete(
  '/:id/moderate',
  ...adminOnly,
  validate({ params: idParamSchema }),
  postController.moderateRemove,
);

/**
 * @openapi
 * /posts/{id}/like:
 *   post:
 *     tags: [Community]
 *     summary: Like a post
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Post liked successfully }
 */
postRoutes.post(
  '/:id/like',
  authenticate,
  validate({ params: idParamSchema }),
  postController.like,
);
/**
 * @openapi
 * /posts/{id}/like:
 *   delete:
 *     tags: [Community]
 *     summary: Unlike a post
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Post unliked successfully }
 */
postRoutes.delete(
  '/:id/like',
  authenticate,
  validate({ params: idParamSchema }),
  postController.unlike,
);

/**
 * @openapi
 * /posts/{id}/bookmark:
 *   post:
 *     tags: [Community]
 *     summary: Bookmark a post
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Post bookmarked successfully }
 */
postRoutes.post(
  '/:id/bookmark',
  authenticate,
  validate({ params: idParamSchema }),
  postController.bookmark,
);
/**
 * @openapi
 * /posts/{id}/bookmark:
 *   delete:
 *     tags: [Community]
 *     summary: Remove a bookmark from a post
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Bookmark removed successfully }
 */
postRoutes.delete(
  '/:id/bookmark',
  authenticate,
  validate({ params: idParamSchema }),
  postController.unbookmark,
);

/**
 * @openapi
 * /posts/{id}/comments:
 *   post:
 *     tags: [Community]
 *     summary: Add a comment to a post
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Comment added successfully }
 */
postRoutes.post(
  '/:id/comments',
  authenticate,
  validate({ params: idParamSchema, body: createCommentSchema }),
  postController.addComment,
);
/**
 * @openapi
 * /posts/{id}/comments:
 *   get:
 *     tags: [Community]
 *     summary: List comments on a post
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *       - name: page
 *         in: query
 *         schema: { type: string }
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200: { description: Comments retrieved successfully }
 */
postRoutes.get(
  '/:id/comments',
  validate({ params: idParamSchema, query: paginationQuerySchema }),
  postController.listComments,
);
/**
 * @openapi
 * /posts/comments/{commentId}:
 *   delete:
 *     tags: [Community]
 *     summary: Delete a comment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Comment deleted successfully }
 */
postRoutes.delete(
  '/comments/:commentId',
  authenticate,
  validate({ params: commentIdParamSchema }),
  postController.deleteComment,
);

/**
 * @openapi
 * /posts/{id}/report:
 *   post:
 *     tags: [Community]
 *     summary: Report a post
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Report created successfully }
 */
postRoutes.post(
  '/:id/report',
  authenticate,
  validate({ params: idParamSchema, body: createReportSchema }),
  postController.report,
);
