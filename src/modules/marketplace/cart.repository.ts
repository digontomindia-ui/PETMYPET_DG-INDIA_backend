import { Types } from 'mongoose';
import { CartModel, WishlistModel } from './cart.schema.js';

export const cartRepository = {
  async getOrCreate(userId: string) {
    const existing = await CartModel.findOne({ userId }).exec();
    if (existing) return existing;
    return CartModel.create({ userId, items: [] });
  },

  async clear(userId: string): Promise<void> {
    await CartModel.updateOne(
      { userId },
      { items: [], couponCode: null, discountAmount: 0 },
    ).exec();
  },
};

export const wishlistRepository = {
  async getOrCreate(userId: string) {
    const existing = await WishlistModel.findOne({ userId }).exec();
    if (existing) return existing;
    return WishlistModel.create({ userId, productIds: [] });
  },

  async add(userId: string, productId: string): Promise<void> {
    await WishlistModel.updateOne(
      { userId },
      { $addToSet: { productIds: new Types.ObjectId(productId) } },
      { upsert: true },
    ).exec();
  },

  async remove(userId: string, productId: string): Promise<void> {
    await WishlistModel.updateOne({ userId }, { $pull: { productIds: productId } }).exec();
  },
};
