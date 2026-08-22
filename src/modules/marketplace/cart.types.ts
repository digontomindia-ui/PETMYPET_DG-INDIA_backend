import type { HydratedDocument, Types } from 'mongoose';

export interface ICartItem {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
}

export interface ICart {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: Types.DocumentArray<ICartItem>;
  couponCode: string | null;
  discountAmount: number;
  updatedAt: Date;
}

export type CartDocument = HydratedDocument<ICart>;

export interface IWishlist {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  productIds: Types.ObjectId[];
}

export type WishlistDocument = HydratedDocument<IWishlist>;
