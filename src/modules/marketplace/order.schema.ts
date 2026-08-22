import { model, Schema } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { PRODUCT_MODEL_NAME } from './product.constants.js';
import {
  DEFAULT_DELIVERY_FEE,
  ORDER_MODEL_NAME,
  ORDER_PAYMENT_METHODS,
  ORDER_PAYMENT_STATUSES,
  ORDER_STATUSES,
} from './order.constants.js';
import type { IOrder, IOrderItem, IShippingAddress } from './order.types.js';

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: PRODUCT_MODEL_NAME, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: true },
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: DEFAULT_DELIVERY_FEE, min: 0 },
    couponCode: { type: String, default: null },
    currency: { type: String, required: true, default: 'INR' },
    shippingAddress: { type: shippingAddressSchema, required: true },
    status: { type: String, enum: Object.values(ORDER_STATUSES), default: ORDER_STATUSES.PENDING },
    paymentMethod: { type: String, enum: Object.values(ORDER_PAYMENT_METHODS), required: true },
    paymentStatus: {
      type: String,
      enum: Object.values(ORDER_PAYMENT_STATUSES),
      default: ORDER_PAYMENT_STATUSES.PENDING,
    },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, createdAt: -1 });

export const OrderModel = model<IOrder>(ORDER_MODEL_NAME, orderSchema);
