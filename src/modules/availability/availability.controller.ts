import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { availabilityService } from './availability.service.js';
import type { GetAvailabilityQuery } from './availability.dto.js';

export const availabilityController = {
  getSlots: asyncHandler(async (req: Request, res: Response) => {
    const result = await availabilityService.getSlots(req.query as GetAvailabilityQuery);
    sendSuccess(res, HTTP_STATUS.OK, result);
  }),
};
