import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { productService } from './product.service.js';
import type { CreateProductInput, UpdateProductInput } from './product.dto.js';

function requireAuth(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const productController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const product = await productService.create(userId, role, req.body as CreateProductInput);
    sendSuccess(res, HTTP_STATUS.CREATED, product, 'Product created');
  }),

  search: asyncHandler(async (req: Request, res: Response) => {
    const { products, total, page, limit } = await productService.search(req.query);
    sendSuccess(res, HTTP_STATUS.OK, products, 'Success', buildPaginationMeta(page, limit, total));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getById(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, product);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const product = await productService.update(
      req.params.id as string,
      userId,
      role,
      req.body as UpdateProductInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, product, 'Product updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    await productService.remove(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Product deleted');
  }),
};
