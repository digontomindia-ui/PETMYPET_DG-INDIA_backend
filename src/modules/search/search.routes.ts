import { Router } from 'express';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { searchController } from './search.controller.js';
import { globalSearchQuerySchema, suggestQuerySchema } from './search.validators.js';

export const searchRoutes = Router();

searchRoutes.get('/', validate({ query: globalSearchQuerySchema }), searchController.search);
searchRoutes.get('/suggestions', validate({ query: suggestQuerySchema }), searchController.suggest);
