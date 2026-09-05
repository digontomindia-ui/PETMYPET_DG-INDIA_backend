import { Types } from 'mongoose';
import { AuditLogModel, BannerModel, FeatureFlagModel, SettingModel } from './admin.schema.js';
import type { AuditAction } from './admin.constants.js';
import type { BannerType } from './admin.types.js';

export const featureFlagRepository = {
  async list() {
    return FeatureFlagModel.find().sort({ key: 1 }).exec();
  },

  async findByKey(key: string) {
    return FeatureFlagModel.findOne({ key: key.toLowerCase() }).exec();
  },

  async upsert(key: string, isEnabled: boolean, description?: string) {
    return FeatureFlagModel.findOneAndUpdate(
      { key: key.toLowerCase() },
      { isEnabled, ...(description !== undefined ? { description } : {}) },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();
  },
};

export const settingRepository = {
  async list() {
    return SettingModel.find().sort({ key: 1 }).exec();
  },

  async findByKey(key: string) {
    return SettingModel.findOne({ key: key.toLowerCase() }).exec();
  },

  async upsert(key: string, value: unknown, description?: string) {
    return SettingModel.findOneAndUpdate(
      { key: key.toLowerCase() },
      { value, ...(description !== undefined ? { description } : {}) },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();
  },
};

export const bannerRepository = {
  async create(data: {
    type?: BannerType;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    linkUrl?: string;
    number?: string;
    icon?: string;
    order?: number;
    startAt?: Date;
    endAt?: Date;
  }) {
    return BannerModel.create(data);
  },

  async listActive() {
    const now = new Date();
    return BannerModel.find({
      isActive: true,
      $and: [
        { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
        { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
      ],
    })
      .sort({ order: 1 })
      .exec();
  },

  async listAll() {
    return BannerModel.find().sort({ order: 1 }).exec();
  },

  async findById(id: string) {
    return BannerModel.findById(id).exec();
  },

  async update(
    id: string,
    data: Partial<{
      type: BannerType;
      title: string;
      subtitle: string;
      imageUrl: string;
      linkUrl: string;
      number: string;
      icon: string;
      order: number;
      isActive: boolean;
      startAt: Date;
      endAt: Date;
    }>,
  ) {
    return BannerModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },

  async remove(id: string) {
    const result = await BannerModel.findByIdAndDelete(id).exec();
    return result !== null;
  },
};

export const auditLogRepository = {
  async record(
    actorId: string,
    action: AuditAction,
    entityType: string,
    entityId: string,
    metadata: Record<string, unknown> = {},
  ) {
    return AuditLogModel.create({
      actorId: new Types.ObjectId(actorId),
      action,
      entityType,
      entityId,
      metadata,
    });
  },

  async list(filter: { entityType?: string; actorId?: string }, skip: number, limit: number) {
    const query: Record<string, unknown> = {};
    if (filter.entityType) query.entityType = filter.entityType;
    if (filter.actorId) query.actorId = filter.actorId;

    const [items, total] = await Promise.all([
      AuditLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      AuditLogModel.countDocuments(query).exec(),
    ]);
    return { items, total };
  },
};
