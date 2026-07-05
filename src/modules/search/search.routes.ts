import { Router } from 'express';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { searchController } from './search.controller.js';
import { globalSearchQuerySchema, suggestQuerySchema } from './search.validators.js';

export const searchRoutes = Router();

/**
 * @openapi
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Search across providers, services, products, and posts
 *     parameters:
 *       - { name: q, in: query, required: true, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Search results }
 */
searchRoutes.get('/', validate({ query: globalSearchQuerySchema }), searchController.search);
/**
 * @openapi
 * /search/suggestions:
 *   get:
 *     tags: [Search]
 *     summary: Get autosuggest results for a partial search query
 *     parameters:
 *       - { name: q, in: query, required: true, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Suggestions listed }
 */
searchRoutes.get('/suggestions', validate({ query: suggestQuerySchema }), searchController.suggest);
