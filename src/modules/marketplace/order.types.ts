import type { HydratedDocument, Types } from 'mongoose';
import type { OrderPaymentMethod, OrderPaymentStatus, OrderStatus } from './order.constants.js';

export interface IOrderItem {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrder {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: Types.DocumentArray<IOrderItem>;
  totalAmount: number;
  currency: string;
  shippingAddress: IShippingAddress;
  status: OrderStatus;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderDocument = HydratedDocument<IOrder>;
