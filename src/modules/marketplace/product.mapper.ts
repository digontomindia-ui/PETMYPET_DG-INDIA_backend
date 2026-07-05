import type { ProductDocument } from './product.types.js';

export function toProductDto(product: ProductDocument) {
  return {
    id: product._id.toString(),
    providerId: product.providerId ? product.providerId.toString() : null,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    images: product.images,
    stock: product.stock,
    sku: product.sku,
    isActive: product.isActive,
    createdAt: product.createdAt,
  };
}
