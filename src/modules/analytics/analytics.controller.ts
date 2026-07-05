import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { analyticsService } from './analytics.service.js';

export const analyticsController = {
  overview: asyncHandler(async (_req: Request, res: Response) => {
    const overview = await analyticsService.overview();
    sendSuccess(res, HTTP_STATUS.OK, overview);
  }),

  bookingsByDay: asyncHandler(async (req: Request, res: Response) => {
    const data = await analyticsService.bookingsByDay(req.query);
    sendSuccess(res, HTTP_STATUS.OK, data);
  }),

  revenueByDay: asyncHandler(async (req: Request, res: Response) => {
    const data = await analyticsService.revenueByDay(req.query);
    sendSuccess(res, HTTP_STATUS.OK, data);
  }),

  userGrowth: asyncHandler(async (req: Request, res: Response) => {
    const data = await analyticsService.userGrowth(req.query);
    sendSuccess(res, HTTP_STATUS.OK, data);
  }),

  topServices: asyncHandler(async (req: Request, res: Response) => {
    const data = await analyticsService.topServices(req.query);
    sendSuccess(res, HTTP_STATUS.OK, data);
  }),

  zonePerformance: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.zonePerformance();
    sendSuccess(res, HTTP_STATUS.OK, data);
  }),
};
