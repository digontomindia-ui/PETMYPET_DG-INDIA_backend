import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { providerRepository } from '../providers/provider.repository.js';
import { serviceRepository } from './service.repository.js';
import { toServiceDto } from './service.mapper.js';
import type { CreateServiceInput, SearchServicesQuery, UpdateServiceInput } from './service.dto.js';

async function requireOwnService(serviceId: string, userId: string) {
  const service = await serviceRepository.findById(serviceId);
  if (!service) throw AppError.notFound('Service not found');

  const provider = await providerRepository.findByUserId(userId);
  if (!provider || service.providerId.toString() !== provider._id.toString()) {
    throw AppError.forbidden('You do not have access to this service');
  }
  return service;
}

export const serviceService = {
  async create(userId: string, input: CreateServiceInput) {
    const provider = await providerRepository.findByUserId(userId);
    if (!provider) throw AppError.notFound('Provider profile not found');

    const service = await serviceRepository.create({
      ...input,
      providerId: provider._id,
      categoryId: new Types.ObjectId(input.categoryId),
    });
    return toServiceDto(service);
  },

  async search(query: SearchServicesQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await serviceRepository.search({
      categoryId: query.categoryId,
      providerId: query.providerId,
      text: query.q,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      skip,
      limit,
    });
    return { services: items.map(toServiceDto), total, page, limit };
  },

  async getById(id: string) {
    const service = await serviceRepository.findById(id);
    if (!service) throw AppError.notFound('Service not found');
    return toServiceDto(service);
  },

  async update(serviceId: string, userId: string, input: UpdateServiceInput) {
    const service = await requireOwnService(serviceId, userId);
    Object.assign(service, input);
    await service.save();
    return toServiceDto(service);
  },

  async remove(serviceId: string, userId: string): Promise<void> {
    const service = await requireOwnService(serviceId, userId);
    await service.softDelete();
  },
};
