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

  const totalAmount = Math.round(items.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100;

  return { id: cart._id.toString(), items, totalAmount };
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
