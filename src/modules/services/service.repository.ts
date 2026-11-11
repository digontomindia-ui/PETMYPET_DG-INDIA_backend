import { BaseRepository } from '../../common/repositories/base.repository.js';
import { ServiceModel } from './service.schema.js';
import { ProviderModel } from '../providers/provider.schema.js';
import { KYC_STATUSES } from '../providers/provider.constants.js';
import type { IService } from './service.types.js';

export interface ServiceSearchFilter {
  categoryId?: string;
  providerId?: string;
  providerType?: string;
  text?: string;
  minPrice?: number;
  maxPrice?: number;
  skip: number;
  limit: number;
}

export class ServiceRepository extends BaseRepository<IService> {
  constructor() {
    super(ServiceModel);
  }

  async search(filter: ServiceSearchFilter) {
    const query: Record<string, unknown> = { isActive: true };
    if (filter.categoryId) query.categoryId = filter.categoryId;
    // Browse listings hide unapproved/inactive providers (their shell profiles duplicate the
    // same template package); a direct providerId lookup is left as-is. An optional providerType
    // narrows the browse to one vertical (e.g. only GROOMER services).
    if (filter.providerId) query.providerId = filter.providerId;
    else {
      const providerFilter: Record<string, unknown> = {
        kycStatus: KYC_STATUSES.APPROVED,
        isActive: true,
      };
      if (filter.providerType) providerFilter.providerType = filter.providerType;
      query.providerId = { $in: await ProviderModel.distinct('_id', providerFilter) };
    }
    if (filter.text) query.$text = { $search: filter.text };
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      query.price = {
        ...(filter.minPrice !== undefined ? { $gte: filter.minPrice } : {}),
        ...(filter.maxPrice !== undefined ? { $lte: filter.maxPrice } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.model.find(query).skip(filter.skip).limit(filter.limit).sort({ createdAt: -1 }).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { items, total };
  }
}

export const serviceRepository = new ServiceRepository();
