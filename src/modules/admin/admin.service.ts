import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import {
  auditLogRepository,
  bannerRepository,
  featureFlagRepository,
  settingRepository,
} from './admin.repository.js';
import { toAuditLogDto, toBannerDto, toFeatureFlagDto, toSettingDto } from './admin.mapper.js';
import type { AuditAction } from './admin.constants.js';
import type {
  CreateBannerInput,
  ListAuditLogsQuery,
  UpdateBannerInput,
  UpsertFeatureFlagInput,
  UpsertSettingInput,
} from './admin.dto.js';

export const featureFlagService = {
  async list() {
    const flags = await featureFlagRepository.list();
    return flags.map(toFeatureFlagDto);
  },

  async upsert(key: string, input: UpsertFeatureFlagInput) {
    const flag = await featureFlagRepository.upsert(key, input.isEnabled, input.description);
    return toFeatureFlagDto(flag);
  },
};

export const settingService = {
  async list() {
    const settings = await settingRepository.list();
    return settings.map(toSettingDto);
  },

  async upsert(key: string, input: UpsertSettingInput) {
    const setting = await settingRepository.upsert(key, input.value, input.description);
    return toSettingDto(setting);
  },
};

export const bannerService = {
  async create(input: CreateBannerInput) {
    const banner = await bannerRepository.create(input);
    return toBannerDto(banner);
  },

  async listActive() {
    const banners = await bannerRepository.listActive();
    return banners.map(toBannerDto);
  },

  async listAll() {
    const banners = await bannerRepository.listAll();
    return banners.map(toBannerDto);
  },

  async update(id: string, input: UpdateBannerInput) {
    const banner = await bannerRepository.update(id, input);
    if (!banner) throw AppError.notFound('Banner not found');
    return toBannerDto(banner);
  },

  async remove(id: string): Promise<void> {
    const removed = await bannerRepository.remove(id);
    if (!removed) throw AppError.notFound('Banner not found');
  },
};

export const auditLogService = {
  /** Shared by any module's admin actions to leave an audit trail. */
  async record(
    actorId: string,
    action: AuditAction,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await auditLogRepository.record(actorId, action, entityType, entityId, metadata);
  },

  async list(query: ListAuditLogsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await auditLogRepository.list(
      { entityType: query.entityType, actorId: query.actorId },
      skip,
      limit,
    );
    return { logs: items.map(toAuditLogDto), total, page, limit };
  },
};
