import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { blogService } from './blog.service.js';
import type { CreateBlogInput, UpdateBlogInput } from './blog.dto.js';

export const blogController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const blog = await blogService.create(req.user.userId, req.body as CreateBlogInput);
    sendSuccess(res, HTTP_STATUS.CREATED, blog, 'Blog post created');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { blogs, total, page, limit } = await blogService.listPublished(req.query);
    sendSuccess(res, HTTP_STATUS.OK, blogs, 'Success', buildPaginationMeta(page, limit, total));
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const blog = await blogService.getBySlug(req.params.slug as string);
    sendSuccess(res, HTTP_STATUS.OK, blog);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const blog = await blogService.update(req.params.id as string, req.body as UpdateBlogInput);
    sendSuccess(res, HTTP_STATUS.OK, blog, 'Blog post updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await blogService.remove(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Blog post deleted');
  }),
};
