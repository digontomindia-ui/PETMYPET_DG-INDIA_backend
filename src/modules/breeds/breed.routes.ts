import { Router } from 'express';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { breedController } from './breed.controller.js';
import { listBreedsQuerySchema } from './breed.validators.js';

export const breedRoutes = Router();

/**
 * @openapi
 * /breeds:
 *   get:
 *     tags: [Breeds]
 *     summary: List breeds for a species (used by the "Select Breed" pet-onboarding screen)
 *     parameters:
 *       - name: species
 *         in: query
 *         required: true
 *         schema: { type: string, enum: [DOG, CAT, BIRD, RABBIT, FISH, OTHER] }
 *         example: DOG
 *     responses:
 *       200:
 *         description: Breed list for the requested species
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Success"
 *               data: ["Labrador Retriever", "Golden Retriever", "German Shepherd"]
 */
breedRoutes.get('/', validate({ query: listBreedsQuerySchema }), breedController.list);
