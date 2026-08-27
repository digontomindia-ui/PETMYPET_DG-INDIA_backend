import type { Request, Response } from 'express';
import { sendSuccess } from '../../common/utils/api-response.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { BREED_CATALOG } from './breed.constants.js';
import type { ListBreedsQuery } from './breed.dto.js';

export const breedController = {
  list: (req: Request, res: Response): void => {
    const { species } = req.query as unknown as ListBreedsQuery;
    sendSuccess(res, HTTP_STATUS.OK, BREED_CATALOG[species] ?? []);
  },
};
