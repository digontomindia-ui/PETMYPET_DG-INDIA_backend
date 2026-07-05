import type { CityDocument, ZoneDocument } from './zone.types.js';

export function toCityDto(city: CityDocument) {
  return {
    id: city._id.toString(),
    name: city.name,
    state: city.state,
    country: city.country,
    isActive: city.isActive,
    workingHours: city.workingHours,
  };
}

export function toZoneDto(zone: ZoneDocument) {
  return {
    id: zone._id.toString(),
    name: zone.name,
    cityId: zone.cityId.toString(),
    coordinates: zone.center.coordinates,
    radiusMeters: zone.radiusMeters,
    isActive: zone.isActive,
  };
}
