import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { cartController } from './cart.controller.js';
import { addToCartSchema, productIdParamSchema, updateCartItemSchema } from './cart.validators.js';

export const cartRoutes = Router();

cartRoutes.use(authenticate);

cartRoutes.get('/', cartController.getCart);
cartRoutes.post('/items', validate({ body: addToCartSchema }), cartController.addItem);
cartRoutes.put(
  '/items/:productId',
  validate({ params: productIdParamSchema, body: updateCartItemSchema }),
  cartController.updateItem,
);
cartRoutes.delete(
  '/items/:productId',
  validate({ params: productIdParamSchema }),
  cartController.removeItem,
);
cartRoutes.delete('/', cartController.clearCart);
