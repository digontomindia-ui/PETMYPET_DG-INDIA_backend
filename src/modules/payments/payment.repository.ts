import { BaseRepository } from '../../common/repositories/base.repository.js';
import { PaymentModel } from './payment.schema.js';
import type { IPayment } from './payment.types.js';

export class PaymentRepository extends BaseRepository<IPayment> {
  constructor() {
    super(PaymentModel);
  }

  async findByRazorpayOrderId(orderId: string) {
    return this.model.findOne({ razorpayOrderId: orderId }).exec();
  }

  async findLatestForBooking(bookingId: string) {
    return this.model.findOne({ bookingId }).sort({ createdAt: -1 }).exec();
  }
}

export const paymentRepository = new PaymentRepository();
