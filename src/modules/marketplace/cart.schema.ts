import { model, Schema } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { PRODUCT_MODEL_NAME } from './product.constants.js';
import { CART_MODEL_NAME, WISHLIST_MODEL_NAME } from './cart.constants.js';
import type { ICart, ICartItem, IWishlist } from './cart.types.js';

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: PRODUCT_MODEL_NAME, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: true },
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const CartModel = model<ICart>(CART_MODEL_NAME, cartSchema);

const wishlistSchema = new Schema<IWishlist>({
  userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true, unique: true },
  productIds: { type: [{ type: Schema.Types.ObjectId, ref: PRODUCT_MODEL_NAME }], default: [] },
});

export const WishlistModel = model<IWishlist>(WISHLIST_MODEL_NAME, wishlistSchema);
