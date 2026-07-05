import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { categoryService } from './category.service.js';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.dto.js';

export const categoryController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.create(req.body as CreateCategoryInput);
    sendSuccess(res, HTTP_STATUS.CREATED, category, 'Category created');
  }),

  list: asyncHandler(async (_req: Request, res: Response) => {
    const categories = await categoryService.list();
    sendSuccess(res, HTTP_STATUS.OK, categories);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.getById(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, category);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.update(
      req.params.id as string,
      req.body as UpdateCategoryInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, category, 'Category updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await categoryService.remove(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Category deleted');
  }),
};
