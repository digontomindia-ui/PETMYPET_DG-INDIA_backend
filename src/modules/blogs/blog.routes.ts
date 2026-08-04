import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { blogController } from './blog.controller.js';
import {
  createBlogSchema,
  idParamSchema,
  listBlogsQuerySchema,
  slugParamSchema,
  updateBlogSchema,
} from './blog.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const blogRoutes = Router();

/**
 * @openapi
 * /blogs:
 *   get:
 *     tags: [Blogs]
 *     summary: List published blog posts
 *     parameters:
 *       - name: tag
 *         in: query
 *         schema: { type: string }
 *         example: "grooming"
 *       - name: q
 *         in: query
 *         schema: { type: string }
 *         example: "monsoon"
 *       - name: page
 *         in: query
 *         schema: { type: string, default: "1" }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         schema: { type: string, default: "20" }
 *         example: "20"
 *     responses:
 *       200:
 *         description: Blog posts listed
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0e5"
 *                   authorId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   title: "Monsoon Grooming Tips for Dogs"
 *                   slug: "monsoon-grooming-tips-for-dogs"
 *                   content: "Keep your dog's coat dry and mite-free this monsoon..."
 *                   coverImageUrl: "https://cdn.petmypet.in/blogs/monsoon-grooming.jpg"
 *                   tags: [grooming, monsoon]
 *                   isPublished: true
 *                   publishedAt: "2026-07-15T09:00:00.000Z"
 *                   createdAt: "2026-07-14T18:30:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 */
blogRoutes.get('/', validate({ query: listBlogsQuerySchema }), blogController.list);
/**
 * @openapi
 * /blogs/{slug}:
 *   get:
 *     tags: [Blogs]
 *     summary: Get a blog post by its slug
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "monsoon-grooming-tips-for-dogs"
 *     responses:
 *       200:
 *         description: Blog post found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0e5"
 *                 authorId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 title: "Monsoon Grooming Tips for Dogs"
 *                 slug: "monsoon-grooming-tips-for-dogs"
 *                 content: "Keep your dog's coat dry and mite-free this monsoon..."
 *                 coverImageUrl: "https://cdn.petmypet.in/blogs/monsoon-grooming.jpg"
 *                 tags: [grooming, monsoon]
 *                 isPublished: true
 *                 publishedAt: "2026-07-15T09:00:00.000Z"
 *                 createdAt: "2026-07-14T18:30:00.000Z"
 *       400:
 *         description: Blog post not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Blog post not found" }
 */
blogRoutes.get('/:slug', validate({ params: slugParamSchema }), blogController.getBySlug);

/**
 * @openapi
 * /blogs:
 *   post:
 *     tags: [Blogs]
 *     summary: Create a blog post (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slug, content]
 *             properties:
 *               title: { type: string, maxLength: 200 }
 *               slug: { type: string, maxLength: 200, description: "Lowercase letters, numbers, and hyphens only" }
 *               content: { type: string }
 *               coverImageUrl: { type: string, format: uri }
 *               tags: { type: array, items: { type: string }, default: [] }
 *               isPublished: { type: boolean, default: false }
 *           example:
 *             title: "Monsoon Grooming Tips for Dogs"
 *             slug: "monsoon-grooming-tips-for-dogs"
 *             content: "Keep your dog's coat dry and mite-free this monsoon..."
 *             coverImageUrl: "https://cdn.petmypet.in/blogs/monsoon-grooming.jpg"
 *             tags: [grooming, monsoon]
 *             isPublished: true
 *     responses:
 *       201:
 *         description: Blog post created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Blog post created
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0e5"
 *                 authorId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 title: "Monsoon Grooming Tips for Dogs"
 *                 slug: "monsoon-grooming-tips-for-dogs"
 *                 content: "Keep your dog's coat dry and mite-free this monsoon..."
 *                 coverImageUrl: "https://cdn.petmypet.in/blogs/monsoon-grooming.jpg"
 *                 tags: [grooming, monsoon]
 *                 isPublished: true
 *                 publishedAt: "2026-08-04T12:00:00.000Z"
 *                 createdAt: "2026-08-04T12:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "slug: Slug must be lowercase letters, numbers, and hyphens" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
 */
blogRoutes.post('/', ...adminOnly, validate({ body: createBlogSchema }), blogController.create);
/**
 * @openapi
 * /blogs/{id}:
 *   put:
 *     tags: [Blogs]
 *     summary: Update a blog post (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0e5"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, maxLength: 200 }
 *               slug: { type: string, maxLength: 200 }
 *               content: { type: string }
 *               coverImageUrl: { type: string, format: uri }
 *               tags: { type: array, items: { type: string } }
 *               isPublished: { type: boolean }
 *           example:
 *             isPublished: true
 *     responses:
 *       200:
 *         description: Blog post updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Blog post updated
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0e5"
 *                 authorId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 title: "Monsoon Grooming Tips for Dogs"
 *                 slug: "monsoon-grooming-tips-for-dogs"
 *                 content: "Keep your dog's coat dry and mite-free this monsoon..."
 *                 coverImageUrl: "https://cdn.petmypet.in/blogs/monsoon-grooming.jpg"
 *                 tags: [grooming, monsoon]
 *                 isPublished: true
 *                 publishedAt: "2026-08-04T12:00:00.000Z"
 *                 createdAt: "2026-08-04T12:00:00.000Z"
 *       400:
 *         description: Validation error or blog post not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Blog post not found" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
 */
blogRoutes.put(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateBlogSchema }),
  blogController.update,
);
/**
 * @openapi
 * /blogs/{id}:
 *   delete:
 *     tags: [Blogs]
 *     summary: Delete a blog post (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0e5"
 *     responses:
 *       200:
 *         description: Blog post deleted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Blog post deleted, data: null }
 *       400:
 *         description: Blog post not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Blog post not found" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
 */
blogRoutes.delete('/:id', ...adminOnly, validate({ params: idParamSchema }), blogController.remove);
