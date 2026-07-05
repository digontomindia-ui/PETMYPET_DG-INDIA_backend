import mongoose, { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
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

  /** Atomically decrements stock for every line item and creates the order in one transaction. */
  async placeOrder(input: PlaceOrderInput) {
    const session = await mongoose.startSession();
    try {
      let order: HydratedDocument<IOrder> | undefined;

      await session.withTransaction(async () => {
        for (const item of input.items) {
          const updated = await ProductModel.findOneAndUpdate(
            { _id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { session },
          );
          if (!updated) {
            throw AppError.conflict(`Insufficient stock for product "${item.name}"`);
          }
        }

        const created = await OrderModel.create(
          [
            {
              userId: new Types.ObjectId(input.userId),
              items: input.items,
              totalAmount: input.totalAmount,
              shippingAddress: input.shippingAddress,
              paymentMethod: input.paymentMethod,
            },
          ],
          { session },
        );
        order = created[0];
      });

      if (!order) throw AppError.internal('Order placement did not complete');
      return order;
    } finally {
      await session.endSession();
    }
  }
}

export const orderRepository = new OrderRepository();
