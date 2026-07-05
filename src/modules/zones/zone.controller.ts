import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { zoneService } from './zone.service.js';
import type {
  CreateCityInput,
  CreateZoneInput,
  UpdateCityInput,
  UpdateZoneInput,
} from './zone.dto.js';

export const zoneController = {
  createCity: asyncHandler(async (req: Request, res: Response) => {
    const city = await zoneService.createCity(req.body as CreateCityInput);
    sendSuccess(res, HTTP_STATUS.CREATED, city, 'City created');
  }),

  listCities: asyncHandler(async (_req: Request, res: Response) => {
    const cities = await zoneService.listCities();
    sendSuccess(res, HTTP_STATUS.OK, cities);
  }),

  getCityById: asyncHandler(async (req: Request, res: Response) => {
    const city = await zoneService.getCityById(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, city);
  }),

  updateCity: asyncHandler(async (req: Request, res: Response) => {
    const city = await zoneService.updateCity(req.params.id as string, req.body as UpdateCityInput);
    sendSuccess(res, HTTP_STATUS.OK, city, 'City updated');
  }),

  deleteCity: asyncHandler(async (req: Request, res: Response) => {
    await zoneService.deleteCity(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, null, 'City deleted');
  }),

  createZone: asyncHandler(async (req: Request, res: Response) => {
    const zone = await zoneService.createZone(req.body as CreateZoneInput);
    sendSuccess(res, HTTP_STATUS.CREATED, zone, 'Zone created');
  }),

  listZones: asyncHandler(async (req: Request, res: Response) => {
    const cityId = typeof req.query.cityId === 'string' ? req.query.cityId : undefined;
    const zones = await zoneService.listZones(cityId);
    sendSuccess(res, HTTP_STATUS.OK, zones);
  }),

  getZoneById: asyncHandler(async (req: Request, res: Response) => {
    const zone = await zoneService.getZoneById(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, zone);
  }),

  updateZone: asyncHandler(async (req: Request, res: Response) => {
    const zone = await zoneService.updateZone(req.params.id as string, req.body as UpdateZoneInput);
    sendSuccess(res, HTTP_STATUS.OK, zone, 'Zone updated');
  }),

  deleteZone: asyncHandler(async (req: Request, res: Response) => {
    await zoneService.deleteZone(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Zone deleted');
  }),

  findNearby: asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng } = req.query as { lat: string; lng: string };
    const zones = await zoneService.findNearbyZone(Number(lat), Number(lng));
    sendSuccess(res, HTTP_STATUS.OK, zones);
  }),
};
