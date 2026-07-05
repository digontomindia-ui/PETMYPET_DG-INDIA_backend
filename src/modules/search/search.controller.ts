import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { searchService } from './search.service.js';
import type { GlobalSearchQuery, SuggestQuery } from './search.dto.js';

export const searchController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const results = await searchService.globalSearch(req.query as unknown as GlobalSearchQuery);
    sendSuccess(res, HTTP_STATUS.OK, results);
  }),

  suggest: asyncHandler(async (req: Request, res: Response) => {
    const suggestions = await searchService.suggest(req.query as unknown as SuggestQuery);
    sendSuccess(res, HTTP_STATUS.OK, suggestions);
  }),
};
