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

postRoutes.get(
  '/',
  optionalAuthenticate,
  validate({ query: listPostsQuerySchema }),
  postController.list,
);

postRoutes.get(
  '/bookmarks/me',
  authenticate,
  validate({ query: paginationQuerySchema }),
  postController.listBookmarked,
);

postRoutes.get(
  '/reports',
  ...adminOnly,
  validate({ query: listReportsQuerySchema }),
  postController.listReports,
);
postRoutes.patch(
  '/reports/:id',
  ...adminOnly,
  validate({ params: reportIdParamSchema, body: updateReportStatusSchema }),
  postController.resolveReport,
);

postRoutes.get(
  '/:id',
  optionalAuthenticate,
  validate({ params: idParamSchema }),
  postController.getById,
);
postRoutes.post('/', authenticate, validate({ body: createPostSchema }), postController.create);
postRoutes.delete('/:id', authenticate, validate({ params: idParamSchema }), postController.remove);
postRoutes.delete(
  '/:id/moderate',
  ...adminOnly,
  validate({ params: idParamSchema }),
  postController.moderateRemove,
);

postRoutes.post(
  '/:id/like',
  authenticate,
  validate({ params: idParamSchema }),
  postController.like,
);
postRoutes.delete(
  '/:id/like',
  authenticate,
  validate({ params: idParamSchema }),
  postController.unlike,
);

postRoutes.post(
  '/:id/bookmark',
  authenticate,
  validate({ params: idParamSchema }),
  postController.bookmark,
);
postRoutes.delete(
  '/:id/bookmark',
  authenticate,
  validate({ params: idParamSchema }),
  postController.unbookmark,
);

postRoutes.post(
  '/:id/comments',
  authenticate,
  validate({ params: idParamSchema, body: createCommentSchema }),
  postController.addComment,
);
postRoutes.get(
  '/:id/comments',
  validate({ params: idParamSchema, query: paginationQuerySchema }),
  postController.listComments,
);
postRoutes.delete(
  '/comments/:commentId',
  authenticate,
  validate({ params: commentIdParamSchema }),
  postController.deleteComment,
);

postRoutes.post(
  '/:id/report',
  authenticate,
  validate({ params: idParamSchema, body: createReportSchema }),
  postController.report,
);
