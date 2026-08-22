import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { BaseRepository } from '../../common/repositories/base.repository.js';
import { ProductModel } from './product.schema.js';
import { OrderModel } from './order.schema.js';
import type { IOrder, IOrderItem, IShippingAddress } from './order.types.js';
import type { OrderPaymentMethod } from './order.constants.js';

export interface PlaceOrderInput {
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  couponCode: string | null;
  shippingAddress: IShippingAddress;
  paymentMethod: OrderPaymentMethod;
}

export class OrderRepository extends BaseRepository<IOrder> {
  constructor() {
    super(OrderModel);
  }

  async findForUser(userId: string, skip: number, limit: number) {
    const filter = { userId };
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  /**
   * Decrements stock for every line item and creates the order.
   * ponytail: this deployment's MongoDB is a standalone instance (no replica set), so
   * multi-document transactions aren't available. Each stock decrement is atomic on its own
   * (single-document findOneAndUpdate); if a later item is out of stock or the order insert
   * fails, we compensate by restoring stock already decremented instead of wrapping the whole
   * loop in a transaction. Upgrade back to session.withTransaction() if the deployment ever
   * gains a replica set.
   */
  async placeOrder(input: PlaceOrderInput) {
    const decremented: { productId: IOrderItem['productId']; quantity: number }[] = [];

    try {
      for (const item of input.items) {
        const updated = await ProductModel.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
        );
        if (!updated) {
          throw AppError.conflict(`Insufficient stock for product "${item.name}"`);
        }
        decremented.push({ productId: item.productId, quantity: item.quantity });
      }

      return await OrderModel.create({
        userId: new Types.ObjectId(input.userId),
        items: input.items,
        totalAmount: input.totalAmount,
        discountAmount: input.discountAmount,
        deliveryFee: input.deliveryFee,
        couponCode: input.couponCode,
        shippingAddress: input.shippingAddress,
        paymentMethod: input.paymentMethod,
      });
    } catch (err) {
      await Promise.all(
        decremented.map((d) =>
          ProductModel.updateOne({ _id: d.productId }, { $inc: { stock: d.quantity } }).exec(),
        ),
      );
      throw err;
    }
  }
}

export const orderRepository = new OrderRepository();
