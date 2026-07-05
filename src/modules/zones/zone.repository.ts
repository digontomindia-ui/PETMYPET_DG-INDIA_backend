import { BaseRepository } from '../../common/repositories/base.repository.js';
import { CityModel, ZoneModel } from './zone.schema.js';
import type { ICity, IZone } from './zone.types.js';

export class CityRepository extends BaseRepository<ICity> {
  constructor() {
    super(CityModel);
  }
}

export class ZoneRepository extends BaseRepository<IZone> {
  constructor() {
    super(ZoneModel);
  }

  /** Returns the active zone whose radius contains the given point, nearest first. */
  async findContainingPoint(
    lng: number,
    lat: number,
  ): Promise<(IZone & { distanceMeters: number })[]> {
    const results = await this.model.aggregate<IZone & { distanceMeters: number }>([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          spherical: true,
          query: { isActive: true, isDeleted: false },
        },
      },
      { $match: { $expr: { $lte: ['$distanceMeters', '$radiusMeters'] } } },
      { $sort: { distanceMeters: 1 } },
    ]);
    return results;
  }
}

export const cityRepository = new CityRepository();
export const zoneRepository = new ZoneRepository();
