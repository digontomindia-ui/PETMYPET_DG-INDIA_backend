import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';

export interface IServiceAddOn {
  name: string;
  price: number;
}

/** One row of the "What's Included" list on the service detail screen (e.g. "Bath" + a bath
 * icon) — distinct from `images`, which are photos of the package/provider, not per-item icons. */
export interface IServiceIncludedItem {
  name: string;
  imageUrl: string;
}

export interface IService extends SoftDeletable {
  _id: Types.ObjectId;
  providerId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  durationMinutes: number;
  images: string[];
  includedItems: IServiceIncludedItem[];
  addOnCatalog: IServiceAddOn[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceDocument = HydratedDocument<IService>;
