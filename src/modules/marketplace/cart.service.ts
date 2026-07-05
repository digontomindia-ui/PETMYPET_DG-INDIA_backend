import { AppError } from '../../common/errors/app-error.js';
import { productRepository } from './product.repository.js';
import { ProductModel } from './product.schema.js';
import { cartRepository, wishlistRepository } from './cart.repository.js';
import { toCartDto, toWishlistDto } from './cart.mapper.js';
import type { AddToCartInput, UpdateCartItemInput } from './cart.dto.js';
import type { ProductDocument } from './product.types.js';

async function hydrateProducts(productIds: string[]): Promise<Map<string, ProductDocument>> {
  if (productIds.length === 0) return new Map();
  const products = await ProductModel.find({ _id: { $in: productIds } }).exec();
  return new Map(products.map((product) => [product._id.toString(), product]));
}

export const cartService = {
  async getCart(userId: string) {
    const cart = await cartRepository.getOrCreate(userId);
    const productsById = await hydrateProducts(cart.items.map((item) => item.productId.toString()));
    return toCartDto(cart, productsById);
  },

  async addItem(userId: string, input: AddToCartInput) {
    const product = await productRepository.findById(input.productId);
    if (!product || !product.isActive) throw AppError.notFound('Product not found');

    const cart = await cartRepository.getOrCreate(userId);
    const existingItem = cart.items.find((item) => item.productId.toString() === input.productId);
    if (existingItem) {
      existingItem.quantity += input.quantity;
    } else {
      cart.items.push({ productId: product._id, quantity: input.quantity });
    }
    await cart.save();

    const productsById = await hydrateProducts(cart.items.map((item) => item.productId.toString()));
    return toCartDto(cart, productsById);
  },

  async updateItem(userId: string, productId: string, input: UpdateCartItemInput) {
    const cart = await cartRepository.getOrCreate(userId);
    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) throw AppError.notFound('Item not found in cart');

    item.quantity = input.quantity;
    await cart.save();

    const productsById = await hydrateProducts(cart.items.map((i) => i.productId.toString()));
    return toCartDto(cart, productsById);
  },

  async removeItem(userId: string, productId: string) {
    const cart = await cartRepository.getOrCreate(userId);
    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) throw AppError.notFound('Item not found in cart');

    item.deleteOne();
    await cart.save();

    const productsById = await hydrateProducts(cart.items.map((i) => i.productId.toString()));
    return toCartDto(cart, productsById);
  },

  async clearCart(userId: string): Promise<void> {
    await cartRepository.clear(userId);
  },

  async getWishlist(userId: string) {
    const wishlist = await wishlistRepository.getOrCreate(userId);
    const productsById = await hydrateProducts(wishlist.productIds.map((id) => id.toString()));
    return toWishlistDto(wishlist, productsById);
  },

  async addToWishlist(userId: string, productId: string): Promise<void> {
    const product = await productRepository.findById(productId);
    if (!product) throw AppError.notFound('Product not found');
    await wishlistRepository.add(userId, productId);
  },

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await wishlistRepository.remove(userId, productId);
  },
};
