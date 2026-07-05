import { AppError } from '../../common/errors/app-error.js';
import { cityRepository, zoneRepository } from './zone.repository.js';
import { toCityDto, toZoneDto } from './zone.mapper.js';
import type {
  CreateCityInput,
  CreateZoneInput,
  UpdateCityInput,
  UpdateZoneInput,
} from './zone.dto.js';

export const zoneService = {
  async createCity(input: CreateCityInput) {
    const city = await cityRepository.create({ ...input, workingHours: input.workingHours ?? [] });
    return toCityDto(city);
  },

  async listCities() {
    const cities = await cityRepository.findMany({ isActive: true }, { sort: { name: 1 } });
    return cities.map(toCityDto);
  },

  async getCityById(id: string) {
    const city = await cityRepository.findById(id);
    if (!city) throw AppError.notFound('City not found');
    return toCityDto(city);
  },

  async updateCity(id: string, input: UpdateCityInput) {
    const city = await cityRepository.updateById(id, input);
    if (!city) throw AppError.notFound('City not found');
    return toCityDto(city);
  },

  async deleteCity(id: string): Promise<void> {
    const deleted = await cityRepository.softDeleteById(id);
    if (!deleted) throw AppError.notFound('City not found');
  },

  async createZone(input: CreateZoneInput) {
    const city = await cityRepository.findById(input.cityId);
    if (!city) throw AppError.badRequest('Referenced city does not exist');

    const zone = await zoneRepository.create({
      name: input.name,
      cityId: city._id,
      center: { type: 'Point', coordinates: input.coordinates },
      radiusMeters: input.radiusMeters,
    });
    return toZoneDto(zone);
  },

  async listZones(cityId?: string) {
    const filter = cityId ? { cityId, isActive: true } : { isActive: true };
    const zones = await zoneRepository.findMany(filter, { sort: { name: 1 } });
    return zones.map(toZoneDto);
  },

  async getZoneById(id: string) {
    const zone = await zoneRepository.findById(id);
    if (!zone) throw AppError.notFound('Zone not found');
    return toZoneDto(zone);
  },

  async updateZone(id: string, input: UpdateZoneInput) {
    const update: Record<string, unknown> = { ...input };
    if (input.coordinates) {
      update.center = { type: 'Point', coordinates: input.coordinates };
      delete update.coordinates;
    }
    const zone = await zoneRepository.updateById(id, update);
    if (!zone) throw AppError.notFound('Zone not found');
    return toZoneDto(zone);
  },

  async deleteZone(id: string): Promise<void> {
    const deleted = await zoneRepository.softDeleteById(id);
    if (!deleted) throw AppError.notFound('Zone not found');
  },

  async findNearbyZone(lat: number, lng: number) {
    const zones = await zoneRepository.findContainingPoint(lng, lat);
    return zones.map((zone) => ({
      id: zone._id.toString(),
      name: zone.name,
      cityId: zone.cityId.toString(),
      distanceMeters: Math.round(zone.distanceMeters),
    }));
  },
};
