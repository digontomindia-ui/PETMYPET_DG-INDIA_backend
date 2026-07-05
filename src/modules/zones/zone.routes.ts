import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { zoneController } from './zone.controller.js';
import {
  createCitySchema,
  createZoneSchema,
  idParamSchema,
  nearbyZoneQuerySchema,
  updateCitySchema,
  updateZoneSchema,
} from './zone.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const cityRoutes = Router();

/**
 * @openapi
 * /cities:
 *   get:
 *     tags: [Cities]
 *     summary: List all cities
 *     responses:
 *       200: { description: List of cities }
 */
cityRoutes.get('/', zoneController.listCities);
/**
 * @openapi
 * /cities/{id}:
 *   get:
 *     tags: [Cities]
 *     summary: Get a city by ID
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: City details }
 */
cityRoutes.get('/:id', validate({ params: idParamSchema }), zoneController.getCityById);
/**
 * @openapi
 * /cities:
 *   post:
 *     tags: [Cities]
 *     summary: Create a city (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: City created }
 */
cityRoutes.post('/', ...adminOnly, validate({ body: createCitySchema }), zoneController.createCity);
/**
 * @openapi
 * /cities/{id}:
 *   put:
 *     tags: [Cities]
 *     summary: Update a city (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: City updated }
 */
cityRoutes.put(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateCitySchema }),
  zoneController.updateCity,
);
/**
 * @openapi
 * /cities/{id}:
 *   delete:
 *     tags: [Cities]
 *     summary: Delete a city (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: City deleted }
 */
cityRoutes.delete(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  zoneController.deleteCity,
);

export const zoneRoutes = Router();

/**
 * @openapi
 * /zones/nearby:
 *   get:
 *     tags: [Zones]
 *     summary: Find zones near a coordinate
 *     parameters:
 *       - { name: lat, in: query, required: true, schema: { type: string } }
 *       - { name: lng, in: query, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: List of nearby zones }
 */
zoneRoutes.get('/nearby', validate({ query: nearbyZoneQuerySchema }), zoneController.findNearby);
/**
 * @openapi
 * /zones:
 *   get:
 *     tags: [Zones]
 *     summary: List all zones
 *     responses:
 *       200: { description: List of zones }
 */
zoneRoutes.get('/', zoneController.listZones);
/**
 * @openapi
 * /zones/{id}:
 *   get:
 *     tags: [Zones]
 *     summary: Get a zone by ID
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Zone details }
 */
zoneRoutes.get('/:id', validate({ params: idParamSchema }), zoneController.getZoneById);
/**
 * @openapi
 * /zones:
 *   post:
 *     tags: [Zones]
 *     summary: Create a zone (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Zone created }
 */
zoneRoutes.post('/', ...adminOnly, validate({ body: createZoneSchema }), zoneController.createZone);
/**
 * @openapi
 * /zones/{id}:
 *   put:
 *     tags: [Zones]
 *     summary: Update a zone (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Zone updated }
 */
zoneRoutes.put(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateZoneSchema }),
  zoneController.updateZone,
);
/**
 * @openapi
 * /zones/{id}:
 *   delete:
 *     tags: [Zones]
 *     summary: Delete a zone (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Zone deleted }
 */
zoneRoutes.delete(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  zoneController.deleteZone,
);
