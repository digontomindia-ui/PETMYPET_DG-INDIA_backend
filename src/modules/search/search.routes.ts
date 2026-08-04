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
 *       - name: q
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         example: "dog grooming"
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *         example: "5"
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 services:
 *                   - id: "64f6f7a8b9c0d1e2f3a4b5c6"
 *                     name: "Full Body Dog Grooming"
 *                     price: 899
 *                 products:
 *                   - id: "64f7a8b9c0d1e2f3a4b5c6d7"
 *                     name: "Anti-Tick Shampoo 500ml"
 *                     price: 349
 *                 providers:
 *                   - id: "64f8b9c0d1e2f3a4b5c6d7e8"
 *                     name: "Happy Paws Grooming Studio"
 *                     providerType: GROOMER
 *                     rating: 4.6
 *                 blogs:
 *                   - id: "64f9c0d1e2f3a4b5c6d7e8f9"
 *                     title: "5 Tips for a Calm Grooming Session"
 *                     slug: "5-tips-for-a-calm-grooming-session"
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "q: String must contain at least 1 character(s)"
 */
searchRoutes.get('/', validate({ query: globalSearchQuerySchema }), searchController.search);
/**
 * @openapi
 * /search/suggestions:
 *   get:
 *     tags: [Search]
 *     summary: Get autosuggest results for a partial search query
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         example: "dog gro"
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *         example: "8"
 *     responses:
 *       200:
 *         description: Suggestions listed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: string } }
 *             example:
 *               success: true
 *               message: Success
 *               data: ["Dog Grooming", "Dog Grooming at Home", "Happy Paws Grooming Studio"]
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "q: String must contain at least 1 character(s)"
 */
searchRoutes.get('/suggestions', validate({ query: suggestQuerySchema }), searchController.suggest);
