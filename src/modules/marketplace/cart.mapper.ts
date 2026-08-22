import { DEFAULT_DELIVERY_FEE } from './order.constants.js';
import type { ProductDocument } from './product.types.js';
import type { CartDocument, WishlistDocument } from './cart.types.js';

export function toCartDto(cart: CartDocument, productsById: Map<string, ProductDocument>) {
  const items = cart.items
    .map((item) => {
      const product = productsById.get(item.productId.toString());
      if (!product) return null;
      return {
        productId: item.productId.toString(),
        name: product.name,
        price: product.price,
        images: product.images,
        quantity: item.quantity,
        subtotal: Math.round(product.price * item.quantity * 100) / 100,
      };
    })
    .filter((item) => item !== null);

  const subtotal = Math.round(items.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100;
  const deliveryFee = items.length > 0 ? DEFAULT_DELIVERY_FEE : 0;
  const totalAmount = Math.max(0, subtotal - cart.discountAmount + deliveryFee);

  return {
    id: cart._id.toString(),
    items,
    subtotal,
    discountAmount: cart.discountAmount,
    couponCode: cart.couponCode,
    deliveryFee,
    totalAmount,
  };
}

export function toWishlistDto(
  wishlist: WishlistDocument,
  productsById: Map<string, ProductDocument>,
) {
  const products = wishlist.productIds
    .map((id) => productsById.get(id.toString()))
    .filter((product) => product !== undefined)
    .map((product) => ({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      images: product.images,
    }));

  return { id: wishlist._id.toString(), products };
}
