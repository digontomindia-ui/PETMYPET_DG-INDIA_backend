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

blogRoutes.get('/', validate({ query: listBlogsQuerySchema }), blogController.list);
blogRoutes.get('/:slug', validate({ params: slugParamSchema }), blogController.getBySlug);

blogRoutes.post('/', ...adminOnly, validate({ body: createBlogSchema }), blogController.create);
blogRoutes.put(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateBlogSchema }),
  blogController.update,
);
blogRoutes.delete('/:id', ...adminOnly, validate({ params: idParamSchema }), blogController.remove);
