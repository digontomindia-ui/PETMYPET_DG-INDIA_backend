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
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Blog posts listed }
 */
blogRoutes.get('/', validate({ query: listBlogsQuerySchema }), blogController.list);
/**
 * @openapi
 * /blogs/{slug}:
 *   get:
 *     tags: [Blogs]
 *     summary: Get a blog post by its slug
 *     parameters:
 *       - { name: slug, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Blog post found }
 */
blogRoutes.get('/:slug', validate({ params: slugParamSchema }), blogController.getBySlug);

/**
 * @openapi
 * /blogs:
 *   post:
 *     tags: [Blogs]
 *     summary: Create a blog post (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Blog post created }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Blog post updated }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Blog post deleted }
 */
blogRoutes.delete('/:id', ...adminOnly, validate({ params: idParamSchema }), blogController.remove);
