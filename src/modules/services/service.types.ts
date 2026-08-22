import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';

export interface IServiceAddOn {
  name: string;
  price: number;
}

export interface IService extends SoftDeletable {
  _id: Types.ObjectId;
  providerId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  images: string[];
  addOnCatalog: IServiceAddOn[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceDocument = HydratedDocument<IService>;
