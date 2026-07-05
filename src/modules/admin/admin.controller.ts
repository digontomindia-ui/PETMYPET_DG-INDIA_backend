import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import {
  auditLogService,
  bannerService,
  featureFlagService,
  settingService,
} from './admin.service.js';
import { adminDashboardService } from './admin.dashboard.service.js';
import type {
  CreateBannerInput,
  UpdateBannerInput,
  UpsertFeatureFlagInput,
  UpsertSettingInput,
} from './admin.dto.js';

export const adminController = {
  getDashboard: asyncHandler(async (_req: Request, res: Response) => {
    const dashboard = await adminDashboardService.getDashboard();
    sendSuccess(res, HTTP_STATUS.OK, dashboard);
  }),

  listFeatureFlags: asyncHandler(async (_req: Request, res: Response) => {
    const flags = await featureFlagService.list();
    sendSuccess(res, HTTP_STATUS.OK, flags);
  }),

  upsertFeatureFlag: asyncHandler(async (req: Request, res: Response) => {
    const flag = await featureFlagService.upsert(
      req.params.key as string,
      req.body as UpsertFeatureFlagInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, flag, 'Feature flag updated');
  }),

  listSettings: asyncHandler(async (_req: Request, res: Response) => {
    const settings = await settingService.list();
    sendSuccess(res, HTTP_STATUS.OK, settings);
  }),

  upsertSetting: asyncHandler(async (req: Request, res: Response) => {
    const setting = await settingService.upsert(
      req.params.key as string,
      req.body as UpsertSettingInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, setting, 'Setting updated');
  }),

  createBanner: asyncHandler(async (req: Request, res: Response) => {
    const banner = await bannerService.create(req.body as CreateBannerInput);
    sendSuccess(res, HTTP_STATUS.CREATED, banner, 'Banner created');
  }),

  listActiveBanners: asyncHandler(async (_req: Request, res: Response) => {
    const banners = await bannerService.listActive();
    sendSuccess(res, HTTP_STATUS.OK, banners);
  }),

  listAllBanners: asyncHandler(async (_req: Request, res: Response) => {
    const banners = await bannerService.listAll();
    sendSuccess(res, HTTP_STATUS.OK, banners);
  }),

  updateBanner: asyncHandler(async (req: Request, res: Response) => {
    const banner = await bannerService.update(
      req.params.id as string,
      req.body as UpdateBannerInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, banner, 'Banner updated');
  }),

  removeBanner: asyncHandler(async (req: Request, res: Response) => {
    await bannerService.remove(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Banner deleted');
  }),

  listAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    const { logs, total, page, limit } = await auditLogService.list(req.query);
    sendSuccess(res, HTTP_STATUS.OK, logs, 'Success', buildPaginationMeta(page, limit, total));
  }),
};
