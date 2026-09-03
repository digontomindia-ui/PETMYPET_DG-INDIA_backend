import type {
  AuditLogDocument,
  BannerDocument,
  FeatureFlagDocument,
  SettingDocument,
} from './admin.types.js';

export function toFeatureFlagDto(flag: FeatureFlagDocument) {
  return {
    id: flag._id.toString(),
    key: flag.key,
    isEnabled: flag.isEnabled,
    description: flag.description,
    updatedAt: flag.updatedAt,
  };
}

export function toSettingDto(setting: SettingDocument) {
  return {
    id: setting._id.toString(),
    key: setting.key,
    value: setting.value,
    description: setting.description,
    updatedAt: setting.updatedAt,
  };
}

export function toBannerDto(banner: BannerDocument) {
  return {
    id: banner._id.toString(),
    type: banner.type,
    title: banner.title,
    subtitle: banner.subtitle,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl,
    number: banner.number,
    icon: banner.icon,
    order: banner.order,
    isActive: banner.isActive,
    startAt: banner.startAt,
    endAt: banner.endAt,
  };
}

export function toAuditLogDto(log: AuditLogDocument) {
  return {
    id: log._id.toString(),
    actorId: log.actorId.toString(),
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata,
    createdAt: log.createdAt,
  };
}
