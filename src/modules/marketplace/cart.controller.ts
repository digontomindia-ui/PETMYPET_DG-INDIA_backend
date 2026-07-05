import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { cartService } from './cart.service.js';
import type { AddToCartInput, UpdateCartItemInput } from './cart.dto.js';

function requireAuth(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const cartController = {
  getCart: asyncHandler(async (req: Request, res: Response) => {
    const cart = await cartService.getCart(requireAuth(req));
    sendSuccess(res, HTTP_STATUS.OK, cart);
  }),

  addItem: asyncHandler(async (req: Request, res: Response) => {
    const cart = await cartService.addItem(requireAuth(req), req.body as AddToCartInput);
    sendSuccess(res, HTTP_STATUS.CREATED, cart, 'Item added to cart');
  }),

  updateItem: asyncHandler(async (req: Request, res: Response) => {
    const cart = await cartService.updateItem(
      requireAuth(req),
      req.params.productId as string,
      req.body as UpdateCartItemInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, cart, 'Cart updated');
  }),

  removeItem: asyncHandler(async (req: Request, res: Response) => {
    const cart = await cartService.removeItem(requireAuth(req), req.params.productId as string);
    sendSuccess(res, HTTP_STATUS.OK, cart, 'Item removed from cart');
  }),

  clearCart: asyncHandler(async (req: Request, res: Response) => {
    await cartService.clearCart(requireAuth(req));
    sendSuccess(res, HTTP_STATUS.OK, null, 'Cart cleared');
  }),

  getWishlist: asyncHandler(async (req: Request, res: Response) => {
    const wishlist = await cartService.getWishlist(requireAuth(req));
    sendSuccess(res, HTTP_STATUS.OK, wishlist);
  }),

  addToWishlist: asyncHandler(async (req: Request, res: Response) => {
    await cartService.addToWishlist(requireAuth(req), req.params.productId as string);
    sendSuccess(res, HTTP_STATUS.CREATED, null, 'Added to wishlist');
  }),

  removeFromWishlist: asyncHandler(async (req: Request, res: Response) => {
    await cartService.removeFromWishlist(requireAuth(req), req.params.productId as string);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Removed from wishlist');
  }),
};
