import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { ROLES, type Role } from '../../common/constants/roles.js';
import { walletService } from '../wallet/wallet.service.js';
import { WALLET_TRANSACTION_REASONS } from '../wallet/wallet.constants.js';
import { notificationService } from '../notifications/notification.service.js';
import { NOTIFICATION_TYPES } from '../notifications/notification.constants.js';
import { ProductModel } from './product.schema.js';
import { cartRepository } from './cart.repository.js';
import { orderRepository } from './order.repository.js';
import { toOrderDto } from './order.mapper.js';
import {
  ORDER_PAYMENT_METHODS,
  ORDER_PAYMENT_STATUSES,
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
} from './order.constants.js';
import type { ListOrdersQuery, PlaceOrderInput, UpdateOrderStatusInput } from './order.dto.js';
import type { IOrderItem } from './order.types.js';
import type { OrderStatus } from './order.constants.js';

export const orderService = {
  async placeOrder(userId: string, input: PlaceOrderInput) {
    const cart = await cartRepository.getOrCreate(userId);
    if (cart.items.length === 0) throw AppError.badRequest('Your cart is empty');

    const products = await ProductModel.find({
      _id: { $in: cart.items.map((item) => item.productId) },
    }).exec();
    const productsById = new Map(products.map((p) => [p._id.toString(), p]));

    const items: IOrderItem[] = [];
    for (const cartItem of cart.items) {
      const product = productsById.get(cartItem.productId.toString());
      if (!product || !product.isActive) {
        throw AppError.badRequest(`A product in your cart is no longer available`);
      }
      items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
      } as IOrderItem);
    }

    const totalAmount =
      Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;

    const order = await orderRepository.placeOrder({
      userId,
      items,
      totalAmount,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
    });

    if (input.paymentMethod === ORDER_PAYMENT_METHODS.WALLET) {
      try {
        await walletService.debit(
          userId,
          totalAmount,
          WALLET_TRANSACTION_REASONS.ORDER_PAYMENT,
          order._id.toString(),
          'Marketplace order payment',
        );
        order.paymentStatus = ORDER_PAYMENT_STATUSES.PAID;
        await order.save();
      } catch (err) {
        await restockAndCancel(order._id.toString(), items);
        throw err;
      }
    }

    await cartRepository.clear(userId);

    await notificationService.notify({
      userId,
      type: NOTIFICATION_TYPES.GENERIC,
      title: 'Order placed',
      body: `Your order for ${order.currency} ${order.totalAmount} has been placed`,
      data: { orderId: order._id.toString() },
    });

    return toOrderDto(order);
  },

  async getById(orderId: string, userId: string, role: Role) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw AppError.notFound('Order not found');
    if (role !== ROLES.SUPER_ADMIN && order.userId.toString() !== userId) {
      throw AppError.forbidden('This order does not belong to you');
    }
    return toOrderDto(order);
  },

  async listMine(userId: string, query: ListOrdersQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await orderRepository.findForUser(userId, skip, limit);
    return { orders: items.map(toOrderDto), total, page, limit };
  },

  async updateStatus(orderId: string, input: UpdateOrderStatusInput) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw AppError.notFound('Order not found');

    const allowed: OrderStatus[] = ORDER_TRANSITIONS[order.status];
    if (!allowed.includes(input.status)) {
      throw AppError.badRequest(`Cannot move order from ${order.status} to ${input.status}`);
    }

    if (input.status === ORDER_STATUSES.CANCELLED) {
      await restockItems(
        order.items.map((item) => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
        })),
      );
      if (order.paymentStatus === ORDER_PAYMENT_STATUSES.PAID) {
        await walletService.credit(
          order.userId.toString(),
          order.totalAmount,
          WALLET_TRANSACTION_REASONS.ORDER_REFUND,
          orderId,
          'Order cancellation refund',
        );
        order.paymentStatus = ORDER_PAYMENT_STATUSES.REFUNDED;
      }
    }

    order.status = input.status;
    await order.save();
    return toOrderDto(order);
  },

  async markCodPaid(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw AppError.notFound('Order not found');
    if (order.paymentMethod !== ORDER_PAYMENT_METHODS.CASH_ON_DELIVERY) {
      throw AppError.badRequest('This order is not a cash-on-delivery order');
    }
    order.paymentStatus = ORDER_PAYMENT_STATUSES.PAID;
    await order.save();
    return toOrderDto(order);
  },
};

async function restockItems(items: { productId: string; quantity: number }[]): Promise<void> {
  await Promise.all(
    items.map((item) =>
      ProductModel.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }).exec(),
    ),
  );
}

async function restockAndCancel(orderId: string, items: IOrderItem[]): Promise<void> {
  await restockItems(
    items.map((item) => ({ productId: item.productId.toString(), quantity: item.quantity })),
  );
  await orderRepository.updateById(orderId, { status: ORDER_STATUSES.CANCELLED });
}
