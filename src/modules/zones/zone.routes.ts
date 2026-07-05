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

cityRoutes.get('/', zoneController.listCities);
cityRoutes.get('/:id', validate({ params: idParamSchema }), zoneController.getCityById);
cityRoutes.post('/', ...adminOnly, validate({ body: createCitySchema }), zoneController.createCity);
cityRoutes.put(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateCitySchema }),
  zoneController.updateCity,
);
cityRoutes.delete(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  zoneController.deleteCity,
);

export const zoneRoutes = Router();

zoneRoutes.get('/nearby', validate({ query: nearbyZoneQuerySchema }), zoneController.findNearby);
zoneRoutes.get('/', zoneController.listZones);
zoneRoutes.get('/:id', validate({ params: idParamSchema }), zoneController.getZoneById);
zoneRoutes.post('/', ...adminOnly, validate({ body: createZoneSchema }), zoneController.createZone);
zoneRoutes.put(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateZoneSchema }),
  zoneController.updateZone,
);
zoneRoutes.delete(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  zoneController.deleteZone,
);
