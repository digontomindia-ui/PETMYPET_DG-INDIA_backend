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
 *       200:
 *         description: List of cities
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                   name: Bengaluru
 *                   state: Karnataka
 *                   country: India
 *                   isActive: true
 *                   workingHours: [{ day: MONDAY, openTime: "09:00", closeTime: "21:00" }]
 */
cityRoutes.get('/', zoneController.listCities);
/**
 * @openapi
 * /cities/{id}:
 *   get:
 *     tags: [Cities]
 *     summary: Get a city by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f1"
 *     responses:
 *       200:
 *         description: City details
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                 name: Bengaluru
 *                 state: Karnataka
 *                 country: India
 *                 isActive: true
 *                 workingHours: [{ day: MONDAY, openTime: "09:00", closeTime: "21:00" }]
 *       400:
 *         description: Invalid id parameter or city not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "City not found" }
 */
cityRoutes.get('/:id', validate({ params: idParamSchema }), zoneController.getCityById);
/**
 * @openapi
 * /cities:
 *   post:
 *     tags: [Cities]
 *     summary: Create a city (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, state]
 *             properties:
 *               name: { type: string, maxLength: 100 }
 *               state: { type: string, maxLength: 100 }
 *               country: { type: string, maxLength: 100, default: India }
 *               workingHours:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day: { type: string, enum: [MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY] }
 *                     openTime: { type: string, example: "09:00" }
 *                     closeTime: { type: string, example: "21:00" }
 *           example:
 *             name: Bengaluru
 *             state: Karnataka
 *             country: India
 *             workingHours:
 *               - { day: MONDAY, openTime: "09:00", closeTime: "21:00" }
 *     responses:
 *       201:
 *         description: City created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: City created
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                 name: Bengaluru
 *                 state: Karnataka
 *                 country: India
 *                 isActive: true
 *                 workingHours: [{ day: MONDAY, openTime: "09:00", closeTime: "21:00" }]
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "name is required" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
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
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 100 }
 *               state: { type: string, maxLength: 100 }
 *               country: { type: string, maxLength: 100 }
 *               isActive: { type: boolean }
 *           example:
 *             isActive: false
 *     responses:
 *       200:
 *         description: City updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: City updated
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                 name: Bengaluru
 *                 state: Karnataka
 *                 country: India
 *                 isActive: false
 *                 workingHours: [{ day: MONDAY, openTime: "09:00", closeTime: "21:00" }]
 *       400:
 *         description: Validation error or city not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "City not found" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
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
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f1"
 *     responses:
 *       200:
 *         description: City deleted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: City deleted, data: null }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
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
 *       - name: lat
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         example: "12.9716"
 *       - name: lng
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         example: "77.5946"
 *     responses:
 *       200:
 *         description: List of nearby zones
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0f2"
 *                   name: Indiranagar
 *                   cityId: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                   coordinates: [77.5946, 12.9716]
 *                   radiusMeters: 5000
 *                   isActive: true
 *       400:
 *         description: Invalid lat/lng query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "lat must be a number" }
 */
zoneRoutes.get('/nearby', validate({ query: nearbyZoneQuerySchema }), zoneController.findNearby);
/**
 * @openapi
 * /zones:
 *   get:
 *     tags: [Zones]
 *     summary: List all zones
 *     parameters:
 *       - name: cityId
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f1"
 *         description: Optional filter to zones within a specific city
 *     responses:
 *       200:
 *         description: List of zones
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0f2"
 *                   name: Indiranagar
 *                   cityId: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                   coordinates: [77.5946, 12.9716]
 *                   radiusMeters: 5000
 *                   isActive: true
 */
zoneRoutes.get('/', zoneController.listZones);
/**
 * @openapi
 * /zones/{id}:
 *   get:
 *     tags: [Zones]
 *     summary: Get a zone by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f2"
 *     responses:
 *       200:
 *         description: Zone details
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0f2"
 *                 name: Indiranagar
 *                 cityId: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                 coordinates: [77.5946, 12.9716]
 *                 radiusMeters: 5000
 *                 isActive: true
 *       400:
 *         description: Invalid id parameter or zone not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Zone not found" }
 */
zoneRoutes.get('/:id', validate({ params: idParamSchema }), zoneController.getZoneById);
/**
 * @openapi
 * /zones:
 *   post:
 *     tags: [Zones]
 *     summary: Create a zone (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cityId, coordinates]
 *             properties:
 *               name: { type: string, maxLength: 100 }
 *               cityId: { type: string, description: "24-hex-char ObjectId of the parent city" }
 *               coordinates:
 *                 type: array
 *                 items: { type: number }
 *                 minItems: 2
 *                 maxItems: 2
 *                 description: "[longitude, latitude]"
 *               radiusMeters: { type: number, minimum: 100, maximum: 100000, default: 5000 }
 *           example:
 *             name: Indiranagar
 *             cityId: "64f1a2b3c4d5e6f7a8b9c0f1"
 *             coordinates: [77.5946, 12.9716]
 *             radiusMeters: 5000
 *     responses:
 *       201:
 *         description: Zone created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Zone created
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0f2"
 *                 name: Indiranagar
 *                 cityId: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                 coordinates: [77.5946, 12.9716]
 *                 radiusMeters: 5000
 *                 isActive: true
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "cityId: Invalid city id" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
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
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f2"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 100 }
 *               cityId: { type: string }
 *               coordinates: { type: array, items: { type: number }, minItems: 2, maxItems: 2 }
 *               radiusMeters: { type: number, minimum: 100, maximum: 100000 }
 *               isActive: { type: boolean }
 *           example:
 *             radiusMeters: 7500
 *     responses:
 *       200:
 *         description: Zone updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Zone updated
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0f2"
 *                 name: Indiranagar
 *                 cityId: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                 coordinates: [77.5946, 12.9716]
 *                 radiusMeters: 7500
 *                 isActive: true
 *       400:
 *         description: Validation error or zone not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Zone not found" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
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
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f2"
 *     responses:
 *       200:
 *         description: Zone deleted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Zone deleted, data: null }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
 */
zoneRoutes.delete(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  zoneController.deleteZone,
);
