import type { HydratedDocument, Types } from 'mongoose';
import type { AuditAction } from './admin.constants.js';

export interface IFeatureFlag {
  _id: Types.ObjectId;
  key: string;
  isEnabled: boolean;
  description: string;
  updatedAt: Date;
}

export type FeatureFlagDocument = HydratedDocument<IFeatureFlag>;

export interface ISetting {
  _id: Types.ObjectId;
  key: string;
  value: unknown;
  description: string;
  updatedAt: Date;
}

export type SettingDocument = HydratedDocument<ISetting>;

export interface IBanner {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  order: number;
  isActive: boolean;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
}

export type BannerDocument = HydratedDocument<IBanner>;

export interface IAuditLog {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export type AuditLogDocument = HydratedDocument<IAuditLog>;
