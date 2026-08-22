import { AppError } from '../../common/errors/app-error.js';
import { couponService } from '../coupons/coupon.service.js';
import { productRepository } from './product.repository.js';
import { ProductModel } from './product.schema.js';
import { cartRepository, wishlistRepository } from './cart.repository.js';
import { toCartDto, toWishlistDto } from './cart.mapper.js';
import type { AddToCartInput, ApplyCartCouponInput, UpdateCartItemInput } from './cart.dto.js';
import type { ProductDocument } from './product.types.js';
import type { CartDocument } from './cart.types.js';

/** A coupon applied against the cart's old subtotal may no longer be valid once items
 * change (min-amount no longer met, etc.) — cheaper to clear it and make the client
 * re-apply than to silently keep a possibly-stale discount. */
function clearAppliedCoupon(cart: CartDocument): void {
  cart.couponCode = null;
  cart.discountAmount = 0;
}

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
    clearAppliedCoupon(cart);
    await cart.save();

    const productsById = await hydrateProducts(cart.items.map((item) => item.productId.toString()));
    return toCartDto(cart, productsById);
  },

  async updateItem(userId: string, productId: string, input: UpdateCartItemInput) {
    const cart = await cartRepository.getOrCreate(userId);
    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) throw AppError.notFound('Item not found in cart');

    item.quantity = input.quantity;
    clearAppliedCoupon(cart);
    await cart.save();

    const productsById = await hydrateProducts(cart.items.map((i) => i.productId.toString()));
    return toCartDto(cart, productsById);
  },

  async removeItem(userId: string, productId: string) {
    const cart = await cartRepository.getOrCreate(userId);
    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) throw AppError.notFound('Item not found in cart');

    item.deleteOne();
    clearAppliedCoupon(cart);
    await cart.save();

    const productsById = await hydrateProducts(cart.items.map((i) => i.productId.toString()));
    return toCartDto(cart, productsById);
  },

  async clearCart(userId: string): Promise<void> {
    await cartRepository.clear(userId);
  },

  /** Coupon usage is validated (eligibility + discount amount) but NOT redeemed against the
   * coupons module's usage ledger here — `couponService.redeem` requires a `bookingId`, and
   * marketplace orders aren't bookings. A cart-applied coupon's `perUserLimit` therefore isn't
   * enforced across separate orders the way it is for bookings; only eligibility at apply-time
   * is checked. Revisit if per-user marketplace coupon limits become a real requirement. */
  async applyCoupon(userId: string, input: ApplyCartCouponInput) {
    const cart = await cartRepository.getOrCreate(userId);
    if (cart.items.length === 0) throw AppError.badRequest('Your cart is empty');

    const productsById = await hydrateProducts(cart.items.map((item) => item.productId.toString()));
    const subtotal = cart.items.reduce((sum, item) => {
      const product = productsById.get(item.productId.toString());
      return product ? sum + product.price * item.quantity : sum;
    }, 0);

    const validation = await couponService.validate(input.code, userId, subtotal);
    cart.couponCode = validation.code;
    cart.discountAmount = validation.discountAmount;
    await cart.save();

    return toCartDto(cart, productsById);
  },

  async removeCoupon(userId: string) {
    const cart = await cartRepository.getOrCreate(userId);
    clearAppliedCoupon(cart);
    await cart.save();

    const productsById = await hydrateProducts(cart.items.map((item) => item.productId.toString()));
    return toCartDto(cart, productsById);
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
