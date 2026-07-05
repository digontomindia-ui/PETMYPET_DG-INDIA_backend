import type { OrderDocument } from './order.types.js';

export function toOrderDto(order: OrderDocument) {
  return {
    id: order._id.toString(),
    userId: order.userId.toString(),
    items: order.items.map((item) => ({
      productId: item.productId.toString(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    totalAmount: order.totalAmount,
    currency: order.currency,
    shippingAddress: order.shippingAddress,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
  };
}
