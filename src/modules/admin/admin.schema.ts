import { model, Schema } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import {
  AUDIT_ACTIONS,
  AUDIT_LOG_MODEL_NAME,
  BANNER_MODEL_NAME,
  FEATURE_FLAG_MODEL_NAME,
  SETTING_MODEL_NAME,
} from './admin.constants.js';
import type { IAuditLog, IBanner, IFeatureFlag, ISetting } from './admin.types.js';

const featureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    isEnabled: { type: Boolean, default: false },
    description: { type: String, default: '' },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const FeatureFlagModel = model<IFeatureFlag>(FEATURE_FLAG_MODEL_NAME, featureFlagSchema);

const settingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const SettingModel = model<ISetting>(SETTING_MODEL_NAME, settingSchema);

const bannerSchema = new Schema<IBanner>(
  {
    type: { type: String, enum: ['image', 'stat'], default: 'image' },
    title: { type: String, required: true, maxlength: 200 },
    subtitle: { type: String, default: '', maxlength: 300 },
    imageUrl: { type: String, default: '' },
    linkUrl: { type: String, default: null },
    number: { type: String, default: null },
    icon: { type: String, default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

bannerSchema.index({ isActive: 1, order: 1 });

export const BannerModel = model<IBanner>(BANNER_MODEL_NAME, bannerSchema);

const auditLogSchema = new Schema<IAuditLog>({
  actorId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
  action: { type: String, enum: Object.values(AUDIT_ACTIONS), required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: () => new Date() },
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLogModel = model<IAuditLog>(AUDIT_LOG_MODEL_NAME, auditLogSchema);
