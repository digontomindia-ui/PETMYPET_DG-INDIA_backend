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
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *       - name: page
 *         in: query
 *         schema: { type: string }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *         example: "20"
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *                 meta: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f2b3c4d5e6f7a8b9c0d1e2"
 *                   authorId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   content: "Just adopted a golden retriever puppy! Any tips for the first week?"
 *                   mediaUrls: ["https://cdn.petmypet.in/posts/puppy-1.jpg"]
 *                   likesCount: 12
 *                   commentsCount: 3
 *                   isApproved: true
 *                   viewerHasLiked: false
 *                   createdAt: "2026-07-28T10:15:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "authorId: Invalid id"
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
 *         example: "1"
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *         example: "20"
 *     responses:
 *       200:
 *         description: Bookmarked posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *                 meta: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f2b3c4d5e6f7a8b9c0d1e2"
 *                   authorId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   content: "Just adopted a golden retriever puppy! Any tips for the first week?"
 *                   mediaUrls: ["https://cdn.petmypet.in/posts/puppy-1.jpg"]
 *                   likesCount: 12
 *                   commentsCount: 3
 *                   isApproved: true
 *                   viewerHasLiked: true
 *                   createdAt: "2026-07-28T10:15:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid pagination parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "limit: Expected string, received number"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         schema: { type: string, enum: [PENDING, RESOLVED, DISMISSED] }
 *         example: PENDING
 *       - name: page
 *         in: query
 *         schema: { type: string }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *         example: "20"
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *                 meta: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f4d5e6f7a8b9c0d1e2f3a4"
 *                   postId: "64f2b3c4d5e6f7a8b9c0d1e2"
 *                   reportedBy: "64f5e6f7a8b9c0d1e2f3a4b5"
 *                   reason: "Contains spam links unrelated to pet care"
 *                   status: PENDING
 *                   createdAt: "2026-07-29T09:00:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "status: Invalid enum value. Expected 'PENDING' | 'RESOLVED' | 'DISMISSED'"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f4d5e6f7a8b9c0d1e2f3a4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [RESOLVED, DISMISSED] }
 *             required: [status]
 *           example:
 *             status: RESOLVED
 *     responses:
 *       200:
 *         description: Report status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Report updated
 *               data:
 *                 id: "64f4d5e6f7a8b9c0d1e2f3a4"
 *                 postId: "64f2b3c4d5e6f7a8b9c0d1e2"
 *                 reportedBy: "64f5e6f7a8b9c0d1e2f3a4b5"
 *                 reason: "Contains spam links unrelated to pet care"
 *                 status: RESOLVED
 *                 createdAt: "2026-07-29T09:00:00.000Z"
 *       400:
 *         description: Invalid id or status
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "status: Invalid enum value. Expected 'RESOLVED' | 'DISMISSED'"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f2b3c4d5e6f7a8b9c0d1e2"
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: "64f2b3c4d5e6f7a8b9c0d1e2"
 *                 authorId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 content: "Just adopted a golden retriever puppy! Any tips for the first week?"
 *                 mediaUrls: ["https://cdn.petmypet.in/posts/puppy-1.jpg"]
 *                 likesCount: 12
 *                 commentsCount: 3
 *                 isApproved: true
 *                 viewerHasLiked: false
 *                 createdAt: "2026-07-28T10:15:00.000Z"
 *       400:
 *         description: Invalid post id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "id: Invalid id"
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string, maxLength: 5000 }
 *               mediaUrls: { type: array, items: { type: string, format: uri }, maxItems: 10 }
 *             required: [content]
 *           example:
 *             content: "Just adopted a golden retriever puppy! Any tips for the first week?"
 *             mediaUrls: ["https://cdn.petmypet.in/posts/puppy-1.jpg"]
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Post created
 *               data:
 *                 id: "64f2b3c4d5e6f7a8b9c0d1e2"
 *                 authorId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 content: "Just adopted a golden retriever puppy! Any tips for the first week?"
 *                 mediaUrls: ["https://cdn.petmypet.in/posts/puppy-1.jpg"]
 *                 likesCount: 0
 *                 commentsCount: 0
 *                 isApproved: true
 *                 viewerHasLiked: false
 *                 createdAt: "2026-08-04T08:30:00.000Z"
 *       400:
 *         description: Invalid post payload
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "content: String must contain at least 1 character(s)"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f2b3c4d5e6f7a8b9c0d1e2"
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: Post deleted
 *               data: null
 *       400:
 *         description: Invalid post id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "id: Invalid id"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f2b3c4d5e6f7a8b9c0d1e2"
 *     responses:
 *       200:
 *         description: Post removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: Post removed by moderation
 *               data: null
 *       400:
 *         description: Invalid post id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "id: Invalid id"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f2b3c4d5e6f7a8b9c0d1e2"
 *     responses:
 *       201:
 *         description: Post liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: Post liked
 *               data: null
 *       400:
 *         description: Invalid post id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "id: Invalid id"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f2b3c4d5e6f7a8b9c0d1e2"
 *     responses:
 *       200:
 *         description: Post unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: Post unliked
 *               data: null
 *       400:
 *         description: Invalid post id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "id: Invalid id"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f2b3c4d5e6f7a8b9c0d1e2"
 *     responses:
 *       201:
 *         description: Post bookmarked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: Post bookmarked
 *               data: null
 *       400:
 *         description: Invalid post id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "id: Invalid id"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f2b3c4d5e6f7a8b9c0d1e2"
 *     responses:
 *       200:
 *         description: Bookmark removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: Bookmark removed
 *               data: null
 *       400:
 *         description: Invalid post id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "id: Invalid id"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f2b3c4d5e6f7a8b9c0d1e2"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string, maxLength: 2000 }
 *             required: [content]
 *           example:
 *             content: "Congrats! Make sure to crate-train early, it made a huge difference for us."
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Comment added
 *               data:
 *                 id: "64f3c4d5e6f7a8b9c0d1e2f3"
 *                 postId: "64f2b3c4d5e6f7a8b9c0d1e2"
 *                 authorId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 content: "Congrats! Make sure to crate-train early, it made a huge difference for us."
 *                 createdAt: "2026-08-04T08:35:00.000Z"
 *       400:
 *         description: Invalid comment payload
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "content: String must contain at least 1 character(s)"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f2b3c4d5e6f7a8b9c0d1e2"
 *       - name: page
 *         in: query
 *         schema: { type: string }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *         example: "20"
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *                 meta: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f3c4d5e6f7a8b9c0d1e2f3"
 *                   postId: "64f2b3c4d5e6f7a8b9c0d1e2"
 *                   authorId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   content: "Congrats! Make sure to crate-train early, it made a huge difference for us."
 *                   createdAt: "2026-08-04T08:35:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid post id or pagination parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "id: Invalid id"
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
 *         example: "64f3c4d5e6f7a8b9c0d1e2f3"
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: Comment deleted
 *               data: null
 *       400:
 *         description: Invalid comment id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "commentId: Invalid id"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f2b3c4d5e6f7a8b9c0d1e2"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, maxLength: 1000 }
 *             required: [reason]
 *           example:
 *             reason: "Contains spam links unrelated to pet care"
 *     responses:
 *       201:
 *         description: Report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Post reported
 *               data:
 *                 id: "64f4d5e6f7a8b9c0d1e2f3a4"
 *                 postId: "64f2b3c4d5e6f7a8b9c0d1e2"
 *                 reportedBy: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 reason: "Contains spam links unrelated to pet care"
 *                 status: PENDING
 *                 createdAt: "2026-08-04T08:40:00.000Z"
 *       400:
 *         description: Invalid report payload
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "reason: String must contain at least 1 character(s)"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 */
postRoutes.post(
  '/:id/report',
  authenticate,
  validate({ params: idParamSchema, body: createReportSchema }),
  postController.report,
);
