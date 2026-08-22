import type { ProductDocument } from './product.types.js';

export function toProductDto(product: ProductDocument) {
  return {
    id: product._id.toString(),
    providerId: product.providerId ? product.providerId.toString() : null,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    mrp: product.mrp,
    discountPercent: product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : null,
    images: product.images,
    stock: product.stock,
    sku: product.sku,
    isActive: product.isActive,
    createdAt: product.createdAt,
  };
}
