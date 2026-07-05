import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';
import type { ProductCategory } from './product.constants.js';

export interface IProduct extends SoftDeletable {
  _id: Types.ObjectId;
  providerId: Types.ObjectId | null;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  images: string[];
  stock: number;
  sku: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<IProduct>;
