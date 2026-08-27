import { BaseRepository } from '../../common/repositories/base.repository.js';
import { ProviderModel } from './provider.schema.js';
import type { IProvider } from './provider.types.js';
import type { ProviderType } from '../../common/constants/roles.js';

export interface NearbySearchFilter {
  lng: number;
  lat: number;
  radiusMeters: number;
  providerType?: ProviderType;
  consultationMode?: 'CLINIC' | 'ONLINE';
  trainingGoal?: string;
  skip: number;
  limit: number;
}

export class ProviderRepository extends BaseRepository<IProvider> {
  constructor() {
    super(ProviderModel);
  }

  async findByUserId(userId: string) {
    return this.model.findOne({ userId }).exec();
  }

  async findNearby(filter: NearbySearchFilter) {
    const query: Record<string, unknown> = {
      isActive: true,
      kycStatus: 'APPROVED',
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [filter.lng, filter.lat] },
          $maxDistance: filter.radiusMeters,
        },
      },
    };
    if (filter.providerType) query.providerType = filter.providerType;
    if (filter.consultationMode === 'ONLINE') {
      query['metadata.vet.supportsVideoConsultation'] = true;
    } else if (filter.consultationMode === 'CLINIC') {
      query['metadata.vet.supportsVideoConsultation'] = { $ne: true };
    }
    if (filter.trainingGoal) {
      query['metadata.trainer.trainingPlans.goals'] = filter.trainingGoal;
    }

    return this.model.find(query).skip(filter.skip).limit(filter.limit).exec();
  }

  async applyRating(providerId: string, rating: number): Promise<void> {
    const provider = await this.model.findById(providerId).exec();
    if (!provider) return;

    const newCount = provider.ratingCount + 1;
    const newAverage = (provider.rating * provider.ratingCount + rating) / newCount;

    provider.rating = Math.round(newAverage * 10) / 10;
    provider.ratingCount = newCount;
    await provider.save();
  }
}

export const providerRepository = new ProviderRepository();
