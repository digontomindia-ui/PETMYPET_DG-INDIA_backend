import type { HydratedDocument, Types } from 'mongoose';
import type { ProviderType } from '../../common/constants/roles.js';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';

export interface ICategory extends SoftDeletable {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  iconUrl: string | null;
  providerTypes: ProviderType[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryDocument = HydratedDocument<ICategory>;
